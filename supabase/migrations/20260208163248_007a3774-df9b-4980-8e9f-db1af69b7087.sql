-- Create stores table for user-defined stores
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text DEFAULT '🏪',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- RLS policies for stores
CREATE POLICY "Users can view their own stores"
ON public.stores FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stores"
ON public.stores FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores"
ON public.stores FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stores"
ON public.stores FOR DELETE
USING (auth.uid() = user_id);

-- Create grocery_purchases table for purchase history
CREATE TABLE public.grocery_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ingredient_id uuid REFERENCES public.ingredients(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'g',
  price numeric NOT NULL DEFAULT 0,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on grocery_purchases
ALTER TABLE public.grocery_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for grocery_purchases
CREATE POLICY "Users can view their own purchases"
ON public.grocery_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
ON public.grocery_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases"
ON public.grocery_purchases FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchases"
ON public.grocery_purchases FOR DELETE
USING (auth.uid() = user_id);

-- Add default_store_id to ingredients table
ALTER TABLE public.ingredients 
ADD COLUMN default_store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

-- Create updated_at trigger for stores
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();