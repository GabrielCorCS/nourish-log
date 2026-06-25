import type { IngredientCategory, MealType } from '@/types/database'

export const INGREDIENT_CATEGORIES: { value: IngredientCategory; label: string; emoji: string }[] = [
  { value: 'proteins', label: 'Proteins', emoji: '🥩' },
  { value: 'grains', label: 'Grains', emoji: '🌾' },
  { value: 'vegetables', label: 'Vegetables', emoji: '🥦' },
  { value: 'fruits', label: 'Fruits', emoji: '🍎' },
  { value: 'dairy', label: 'Dairy', emoji: '🥛' },
  { value: 'fats', label: 'Fats & Oils', emoji: '🫒' },
  { value: 'legumes', label: 'Legumes', emoji: '🫘' },
  { value: 'nuts', label: 'Nuts & Seeds', emoji: '🥜' },
  { value: 'condiments', label: 'Condiments', emoji: '🧂' },
  { value: 'beverages', label: 'Beverages', emoji: '🥤' },
  { value: 'takeout', label: 'Takeout', emoji: '🥡' },
  { value: 'baked', label: 'Baked Items', emoji: '🥐' },
  { value: 'packaged', label: 'Packaged Goods', emoji: '📦' },
  { value: 'sweets', label: 'Sweets', emoji: '🍬' },
]

export const MEAL_TYPES: { value: MealType; label: string; emoji: string; timeRange: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅', timeRange: '6:00 - 10:00' },
  { value: 'lunch', label: 'Lunch', emoji: '☀️', timeRange: '11:00 - 14:00' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙', timeRange: '17:00 - 21:00' },
  { value: 'snack', label: 'Snack', emoji: '🍿', timeRange: 'Anytime' },
]

// Whimsical profile-picture choices. Dinosaurs lead (Kaylin's request), then a
// spread of cute critters and characters.
export const AVATAR_EMOJIS = [
  '🦕', '🦖', '🐉', '🐲', '🦊', '🐱', '🐶', '🐼',
  '🐨', '🐸', '🐵', '🐰', '🐯', '🦁', '🐮', '🐷',
  '🐹', '🐻', '🐧', '🐤', '🦉', '🦄', '🐙', '🦋',
  '🐢', '🐝', '🐬', '🦔', '🦦', '🦥', '🦩', '🐳',
]

export const SERVING_UNITS = [
  'g',
  'oz',
  'cup',
  'tbsp',
  'tsp',
  'ml',
  'piece',
  'slice',
  'serving',
]

// Payment cards used for spending entries. A fixed set (the household's cards);
// selection is required on every ledger entry. Colors drive the card-face UI.
export interface PaymentCard {
  id: string
  label: string
  network: string
  gradient: string
  text: string
  subtle: string
}

export const PAYMENT_CARDS: PaymentCard[] = [
  {
    id: 'wells_fargo',
    label: 'Wells Fargo',
    network: 'Visa',
    gradient: 'from-[#C8262C] to-[#7F1417]',
    text: 'text-white',
    subtle: 'text-white/70',
  },
  {
    id: 'discover',
    label: 'Discover',
    network: 'Discover',
    gradient: 'from-[#2D6BE4] to-[#16357E]',
    text: 'text-white',
    subtle: 'text-white/70',
  },
  {
    id: 'amex_gold',
    label: 'Amex Gold',
    network: 'American Express',
    gradient: 'from-[#D9B95C] to-[#A9842B]',
    text: 'text-[#2b2105]',
    subtle: 'text-[#2b2105]/65',
  },
  {
    id: 'business_mastercard',
    label: 'Business Mastercard',
    network: 'Mastercard',
    gradient: 'from-[#22304A] to-[#0E1626]',
    text: 'text-white',
    subtle: 'text-white/65',
  },
]

export const STORE_KINDS = [
  { value: 'grocery', label: 'Grocery store', emoji: '🛒' },
  { value: 'other', label: 'Other store', emoji: '🏬' },
] as const

export type StoreKind = (typeof STORE_KINDS)[number]['value']
export type SpendingKind = StoreKind // 'grocery' | 'other'

export const DEFAULT_GOALS = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
}

export const MACRO_COLORS = {
  calories: 'terracotta',
  protein: 'sage',
  carbs: 'honey',
  fat: 'blush',
} as const

export interface EmojiOption {
  emoji: string
  /** Space-separated search terms used by the picker's search box. */
  keywords: string
}

// Grouped, labelled emoji palette for the picker. Organised by food type with a
// lot more variety than a single flat grid, so items are easy to scan and find.
export const EMOJI_GROUPS: { label: string; emoji: string; items: EmojiOption[] }[] = [
  {
    label: 'Proteins & Meat',
    emoji: '🥩',
    items: [
      { emoji: '🥩', keywords: 'steak beef red meat' },
      { emoji: '🍗', keywords: 'chicken poultry drumstick turkey' },
      { emoji: '🍖', keywords: 'meat pork ribs bone' },
      { emoji: '🥓', keywords: 'bacon pork' },
      { emoji: '🌭', keywords: 'sausage hot dog frank' },
      { emoji: '🍤', keywords: 'shrimp prawn seafood fried' },
      { emoji: '🦐', keywords: 'shrimp prawn seafood' },
      { emoji: '🐟', keywords: 'fish seafood' },
      { emoji: '🍣', keywords: 'sushi salmon fish' },
      { emoji: '🐠', keywords: 'fish seafood' },
      { emoji: '🦀', keywords: 'crab seafood shellfish' },
      { emoji: '🦞', keywords: 'lobster seafood shellfish' },
      { emoji: '🥚', keywords: 'egg protein' },
      { emoji: '🦃', keywords: 'turkey poultry' },
    ],
  },
  {
    label: 'Fruits',
    emoji: '🍎',
    items: [
      { emoji: '🍎', keywords: 'apple red fruit' },
      { emoji: '🍏', keywords: 'apple green fruit' },
      { emoji: '🍌', keywords: 'banana fruit' },
      { emoji: '🍓', keywords: 'strawberry berry fruit' },
      { emoji: '🫐', keywords: 'blueberry berry fruit' },
      { emoji: '🍇', keywords: 'grapes fruit' },
      { emoji: '🍊', keywords: 'orange citrus fruit' },
      { emoji: '🍋', keywords: 'lemon citrus fruit' },
      { emoji: '🍉', keywords: 'watermelon melon fruit' },
      { emoji: '🍑', keywords: 'peach fruit' },
      { emoji: '🍒', keywords: 'cherry berry fruit' },
      { emoji: '🥭', keywords: 'mango fruit tropical' },
      { emoji: '🍍', keywords: 'pineapple fruit tropical' },
      { emoji: '🥝', keywords: 'kiwi fruit' },
      { emoji: '🍐', keywords: 'pear fruit' },
      { emoji: '🥥', keywords: 'coconut fruit' },
    ],
  },
  {
    label: 'Vegetables',
    emoji: '🥦',
    items: [
      { emoji: '🥦', keywords: 'broccoli vegetable green' },
      { emoji: '🥬', keywords: 'lettuce greens leafy spinach kale' },
      { emoji: '🥒', keywords: 'cucumber pickle vegetable' },
      { emoji: '🌽', keywords: 'corn vegetable' },
      { emoji: '🥕', keywords: 'carrot vegetable' },
      { emoji: '🧅', keywords: 'onion vegetable' },
      { emoji: '🧄', keywords: 'garlic vegetable' },
      { emoji: '🍆', keywords: 'eggplant aubergine vegetable' },
      { emoji: '🫑', keywords: 'pepper bell vegetable' },
      { emoji: '🌶️', keywords: 'chili pepper hot spicy' },
      { emoji: '🍄', keywords: 'mushroom fungi vegetable' },
      { emoji: '🥔', keywords: 'potato vegetable' },
      { emoji: '🍅', keywords: 'tomato vegetable' },
      { emoji: '🥗', keywords: 'salad greens vegetable' },
      { emoji: '🫛', keywords: 'peas pea pod vegetable' },
      { emoji: '🥑', keywords: 'avocado vegetable' },
    ],
  },
  {
    label: 'Dairy & Eggs',
    emoji: '🥛',
    items: [
      { emoji: '🥛', keywords: 'milk dairy glass' },
      { emoji: '🧀', keywords: 'cheese dairy' },
      { emoji: '🧈', keywords: 'butter dairy' },
      { emoji: '🍳', keywords: 'egg fried breakfast' },
      { emoji: '🍶', keywords: 'cream yogurt dairy bottle' },
      { emoji: '🥣', keywords: 'yogurt cereal bowl' },
    ],
  },
  {
    label: 'Grains & Bread',
    emoji: '🌾',
    items: [
      { emoji: '🌾', keywords: 'wheat grain cereal' },
      { emoji: '🍚', keywords: 'rice grain' },
      { emoji: '🍞', keywords: 'bread loaf toast' },
      { emoji: '🥖', keywords: 'baguette bread french' },
      { emoji: '🥯', keywords: 'bagel bread' },
      { emoji: '🍝', keywords: 'pasta spaghetti noodles' },
      { emoji: '🍜', keywords: 'noodles ramen soup' },
      { emoji: '🍙', keywords: 'rice ball onigiri' },
      { emoji: '🌽', keywords: 'corn maize grain' },
      { emoji: '🥣', keywords: 'cereal oats oatmeal bowl' },
    ],
  },
  {
    label: 'Baked & Sweets',
    emoji: '🥐',
    items: [
      { emoji: '🥐', keywords: 'croissant pastry baked' },
      { emoji: '🥨', keywords: 'pretzel baked' },
      { emoji: '🧁', keywords: 'cupcake muffin sweet' },
      { emoji: '🍰', keywords: 'cake slice sweet dessert' },
      { emoji: '🎂', keywords: 'cake birthday sweet' },
      { emoji: '🥧', keywords: 'pie dessert baked' },
      { emoji: '🍪', keywords: 'cookie biscuit sweet' },
      { emoji: '🍩', keywords: 'donut doughnut sweet' },
      { emoji: '🍫', keywords: 'chocolate candy sweet' },
      { emoji: '🍬', keywords: 'candy sweet' },
      { emoji: '🍭', keywords: 'lollipop candy sweet' },
      { emoji: '🍮', keywords: 'pudding custard flan dessert' },
      { emoji: '🍯', keywords: 'honey sweet jar' },
      { emoji: '🧇', keywords: 'waffle breakfast sweet' },
      { emoji: '🥞', keywords: 'pancakes breakfast' },
    ],
  },
  {
    label: 'Takeout & Prepared',
    emoji: '🥡',
    items: [
      { emoji: '🥡', keywords: 'takeout box chinese' },
      { emoji: '🍕', keywords: 'pizza takeout italian' },
      { emoji: '🍔', keywords: 'burger hamburger fast food' },
      { emoji: '🍟', keywords: 'fries chips fast food' },
      { emoji: '🌮', keywords: 'taco mexican' },
      { emoji: '🌯', keywords: 'burrito wrap mexican' },
      { emoji: '🥙', keywords: 'pita wrap gyro kebab' },
      { emoji: '🧆', keywords: 'falafel meatball' },
      { emoji: '🥪', keywords: 'sandwich sub' },
      { emoji: '🍱', keywords: 'bento box japanese' },
      { emoji: '🍛', keywords: 'curry rice' },
      { emoji: '🍲', keywords: 'stew soup pot' },
      { emoji: '🥘', keywords: 'paella pan dish' },
      { emoji: '🍣', keywords: 'sushi japanese' },
      { emoji: '🍝', keywords: 'pasta italian' },
    ],
  },
  {
    label: 'Snacks',
    emoji: '🍿',
    items: [
      { emoji: '🍿', keywords: 'popcorn snack' },
      { emoji: '🥨', keywords: 'pretzel snack' },
      { emoji: '🥜', keywords: 'peanuts nuts snack' },
      { emoji: '🌰', keywords: 'chestnut nut snack' },
      { emoji: '🍘', keywords: 'rice cracker snack' },
      { emoji: '🍪', keywords: 'cookie snack' },
      { emoji: '🧀', keywords: 'cheese snack' },
    ],
  },
  {
    label: 'Drinks',
    emoji: '🥤',
    items: [
      { emoji: '🥤', keywords: 'soda drink cup soft' },
      { emoji: '💧', keywords: 'water drink' },
      { emoji: '☕', keywords: 'coffee drink hot' },
      { emoji: '🍵', keywords: 'tea matcha drink hot' },
      { emoji: '🧋', keywords: 'boba bubble tea drink' },
      { emoji: '🧃', keywords: 'juice box drink' },
      { emoji: '🥛', keywords: 'milk drink' },
      { emoji: '🍷', keywords: 'wine alcohol drink' },
      { emoji: '🍺', keywords: 'beer alcohol drink' },
      { emoji: '🍹', keywords: 'cocktail drink alcohol' },
      { emoji: '🧉', keywords: 'mate drink' },
      { emoji: '🥂', keywords: 'champagne toast drink' },
    ],
  },
  {
    label: 'Condiments & Pantry',
    emoji: '🧂',
    items: [
      { emoji: '🧂', keywords: 'salt seasoning condiment' },
      { emoji: '🫒', keywords: 'olive oil fat' },
      { emoji: '🍯', keywords: 'honey syrup condiment' },
      { emoji: '🥫', keywords: 'canned can soup packaged' },
      { emoji: '🫙', keywords: 'jar sauce condiment' },
      { emoji: '🧴', keywords: 'bottle sauce oil dressing' },
      { emoji: '🧄', keywords: 'garlic seasoning' },
      { emoji: '🌶️', keywords: 'spice hot pepper' },
    ],
  },
  {
    label: 'Stores & Places',
    emoji: '🏪',
    items: [
      { emoji: '🏪', keywords: 'store shop convenience market' },
      { emoji: '🛒', keywords: 'cart grocery shopping' },
      { emoji: '🛍️', keywords: 'bags shopping' },
      { emoji: '🏬', keywords: 'department store mall' },
      { emoji: '🧺', keywords: 'basket market' },
      { emoji: '🥖', keywords: 'bakery bread shop' },
    ],
  },
]

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'Home' },
  { path: '/journal', label: 'Journal', icon: 'BookOpen' },
  { path: '/recipes', label: 'Recipes', icon: 'ChefHat' },
  { path: '/pantry', label: 'Pantry', icon: 'Apple' },
  { path: '/progress', label: 'Progress', icon: 'TrendingUp' },
]
