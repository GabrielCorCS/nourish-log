// Turns a free-text meal description ("2 scrambled eggs, sourdough toast with
// butter, a banana") into structured food items with estimated calories and
// macros, so the user can log a whole meal in one sentence.
//
// Auth: invoked from the client via supabase.functions.invoke, so the user's
// JWT is verified automatically (verify_jwt stays ON) — this keeps the Anthropic
// API key from being usable by anonymous callers.
//
// The Anthropic API key is read from the ANTHROPIC_API_KEY edge-function secret.
// When it's unset the function returns { error: 'not_configured' } so the UI can
// show a friendly "set up AI logging" hint instead of failing hard.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

// Single forced tool — Claude must return the meal broken into items with macros.
const TOOL = {
  name: 'log_meal',
  description: 'Record the foods and drinks in the described meal with estimated nutrition.',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'A short, natural name for the whole meal (max ~6 words), e.g. "Eggs & sourdough toast".',
      },
      emoji: {
        type: 'string',
        description: 'A single emoji that best represents the meal.',
      },
      items: {
        type: 'array',
        description: 'Each distinct food or drink mentioned, one entry per item.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'The food or drink.' },
            quantity: {
              type: 'string',
              description: 'The portion in human terms, e.g. "2 large", "1 cup", "1 slice".',
            },
            calories: { type: 'number', description: 'Estimated kcal for the portion.' },
            protein: { type: 'number', description: 'Estimated grams of protein.' },
            carbs: { type: 'number', description: 'Estimated grams of carbohydrate.' },
            fat: { type: 'number', description: 'Estimated grams of fat.' },
          },
          required: ['name', 'quantity', 'calories', 'protein', 'carbs', 'fat'],
        },
      },
    },
    required: ['title', 'emoji', 'items'],
  },
}

const SYSTEM =
  'You are a precise nutrition estimator. Given a free-text description of a meal, ' +
  'break it into its individual food and drink items and estimate the calories and ' +
  'macronutrients (grams of protein, carbs, fat) for the portion described. Use ' +
  'typical US nutrition values for common foods. If a quantity is vague or missing, ' +
  'assume one normal serving. Round to whole numbers. Always call the log_meal tool.'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ error: 'not_configured' })

  let description = ''
  try {
    description = (await req.json())?.description ?? ''
  } catch {
    return json({ error: 'bad_request' }, 400)
  }
  description = String(description).trim()
  if (!description) return json({ error: 'empty' }, 400)

  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'log_meal' },
        messages: [{ role: 'user', content: description.slice(0, 1000) }],
      }),
    })
  } catch (err) {
    return json({ error: 'upstream_unreachable', detail: String(err) }, 502)
  }

  if (!res.ok) {
    const detail = await res.text()
    return json({ error: 'upstream_error', status: res.status, detail }, 502)
  }

  const data = await res.json()
  const block = (data?.content ?? []).find(
    (b: { type?: string; name?: string }) => b.type === 'tool_use' && b.name === 'log_meal',
  )
  if (!block?.input) return json({ error: 'no_result' }, 502)

  return json(block.input)
})
