# NourishLog - Lovable Integration Guide

A cozy meal tracking app built with React, TypeScript, and Supabase.

## Overview

NourishLog is a nutrition tracking application with a warm, cozy design aesthetic. It allows users to:

- **Track meals** with recipes or quick-add ingredients
- **Manage recipes** with automatic nutrition calculation
- **Browse a pantry** of ingredients with full nutrition data
- **View progress** with charts, streaks, and goal tracking
- **Set daily goals** for calories, protein, carbs, and fat

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| TanStack React Query | Server State |
| Zustand | Client State |
| Supabase | Database & Auth |
| Recharts | Charts |
| Lucide React | Icons |
| React Router v6 | Routing |
| date-fns | Date Utilities |

## Pre-Setup Requirements

Before importing into Lovable, you need a Supabase project:

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Project Settings > API

## Database Setup

1. Open your Supabase project's SQL Editor
2. Run the contents of `supabase/schema.sql` - this creates:
   - All tables (ingredients, recipes, food_entries, etc.)
   - Row Level Security (RLS) policies
   - Triggers for nutrition calculation and streak tracking
3. Run the contents of `supabase/seed.sql` - this adds:
   - 40 common ingredients with nutrition data
   - 5 sample recipes
   - Demo user configuration

## Lovable Integration

### 1. Import the Project

Import this codebase into Lovable using your preferred method.

### 2. Connect Supabase

Use Lovable's native Supabase integration:

1. Go to Project Settings in Lovable
2. Add Supabase integration
3. Enter your project URL and anon key

Or set environment variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Enable Authentication (Optional)

The app works in demo mode without auth, but for full functionality:

1. Enable Email auth in Supabase Authentication settings
2. The schema includes triggers to auto-create user settings on signup

## Project Structure

```
src/
├── components/
│   ├── ui/           # Base components (Button, Card, Dialog, etc.)
│   ├── layout/       # AppShell, Sidebar, BottomNav
│   ├── dashboard/    # NutritionRing, TodaySummary, MealTimeline
│   ├── journal/      # CalendarStrip, DayView, MealCard
│   ├── recipes/      # RecipeCard, RecipeGrid, RecipeForm
│   ├── pantry/       # IngredientCard, IngredientList, CategoryTabs
│   ├── progress/     # WeeklyChart, MacroBreakdown, StreakDisplay
│   ├── logging/      # LogMealModal, MealTypeSelector, etc.
│   └── shared/       # MacroDisplay, LoadingState, EmptyState
├── pages/            # Route components
├── hooks/            # React Query hooks for data fetching
├── stores/           # Zustand stores for UI state
├── lib/              # Utilities, Supabase client, constants
└── types/            # TypeScript types
```

## Key Features

### Responsive Design
- Desktop: Sidebar navigation
- Mobile: Bottom tab navigation
- Optimized touch targets and spacing

### Design System

Colors:
- Cream (#FAF7F2) - Main background
- Warm White (#FFFEF9) - Cards, surfaces
- Latte (#D4C4B0) - Borders, dividers
- Espresso (#3D3024) - Primary text
- Caramel (#C4956A) - Accent, CTAs
- Sage (#A8B5A0) - Protein indicator
- Honey (#E8D4A8) - Carbs indicator
- Blush (#E8C4C4) - Fat indicator
- Terracotta (#C8846C) - Calories indicator

Fonts:
- Headings: Fraunces (serif)
- Body: DM Sans (sans-serif)

### Data Flow

1. **Ingredients** - Base nutrition data per serving
2. **Recipes** - Collections of ingredients with calculated totals
3. **Food Entries** - Logged meals (recipe or quick-add ingredients)
4. **User Settings** - Daily goals and preferences
5. **User Streaks** - Automatic streak tracking

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Dashboard | Today's summary and quick actions |
| `/journal` | Journal | Date-based meal history |
| `/recipes` | Recipes | Recipe grid with search/filter |
| `/recipes/new` | RecipeEditor | Create recipe form |
| `/recipes/:id` | RecipeDetail | View single recipe |
| `/recipes/:id/edit` | RecipeEditor | Edit recipe form |
| `/pantry` | Pantry | Ingredient management |
| `/progress` | Progress | Charts and insights |
| `/settings` | Settings | Goals and preferences |

## Component Highlights

### NutritionRing
Animated circular progress indicator for macros. Configurable size and color.

### LogMealModal
Multi-step meal logging flow:
1. Select meal type (breakfast/lunch/dinner/snack)
2. Choose source (recipe or quick-add)
3. Select recipe or add ingredients
4. Adjust servings
5. Review and log

### CalendarStrip
Horizontal week picker for journal navigation.

### RecipeForm
Recipe creation with:
- Emoji picker
- Ingredient search and selection
- Live nutrition calculation
- Servings and time inputs

## Customization

### Adding New Ingredients
1. Go to Pantry page
2. Click "Add" button
3. Fill in nutrition data per serving

### Modifying Goals
1. Go to Settings page
2. Update daily calorie/macro targets
3. Changes reflect immediately in progress views

### Theming
All colors are defined as CSS variables in `globals.css` and extended in `tailwind.config.ts`. Modify these files to customize the color scheme.

## Demo Mode

The app includes a demo user ID (`00000000-0000-0000-0000-000000000000`) for development. In demo mode:
- All CRUD operations work
- Data persists in Supabase
- No authentication required

For production, enable Supabase Auth and the RLS policies will automatically scope data to authenticated users.

## Troubleshooting

### No data appearing
- Ensure you've run both `schema.sql` and `seed.sql`
- Check Supabase credentials are set correctly

### Nutrition not calculating
- The trigger `trigger_calculate_recipe_nutrition` should auto-update recipe totals
- Verify the trigger exists in Supabase

### Authentication issues
- For demo mode, ensure the demo user exists in `user_settings` and `user_streaks` tables
- For production, enable auth in Supabase and user settings will be created automatically

## Support

This project was built for use with Lovable. For issues:
- Check Lovable documentation
- Verify Supabase configuration
- Review browser console for errors
