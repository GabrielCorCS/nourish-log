

# Implementation Plan: Google Auth with Invite-Only Access + Grocery Inventory Tracking

## Overview

This plan adds three major features to NourishLog:
1. **Google Authentication** with Supabase Auth
2. **Invite-Only Access** - only users on an approved list can sign in
3. **Grocery Inventory Tracking** - track stock levels of ingredients with automatic restock alerts

---

## Part 1: Authentication Architecture

### Current State
- The app uses a custom `app_users` table with manual user selection
- No real authentication - anyone can view/edit any user's data
- RLS policies currently allow all operations (`true`)

### New Architecture
- Use Supabase's built-in `auth.users` for authentication
- Create a `profiles` table linked to `auth.users` for user metadata
- Create an `invited_emails` table to whitelist allowed users
- Implement proper RLS policies so users can only access their own data

### Database Changes

**New Tables:**

```text
+------------------+          +------------------+
|  auth.users      |          |  invited_emails  |
|  (Supabase)      |          +------------------+
+------------------+          | id (uuid)        |
| id (uuid)        |          | email (text)     |
| email (text)     |          | invited_by (uuid)|
+--------+---------+          | created_at       |
         |                    +------------------+
         |
         v
+------------------+
|    profiles      |
+------------------+
| id (uuid) FK     |
| email (text)     |
| name (text)      |
| avatar_emoji     |
| is_admin (bool)  |
| created_at       |
+------------------+
         |
         v
+------------------+
|   user_roles     |
+------------------+
| id (uuid)        |
| user_id FK       |
| role (enum)      |
+------------------+
```

**Migration Steps:**
1. Create `app_role` enum (`admin`, `user`)
2. Create `user_roles` table with proper RLS
3. Create `profiles` table linked to `auth.users(id)`
4. Create `invited_emails` table for the whitelist
5. Create trigger to auto-create profile on signup
6. Create `has_role()` security definer function for RLS
7. Update all existing tables to reference `profiles.id` instead of `app_users.id`
8. Update all RLS policies to use `auth.uid()`

---

## Part 2: Invite-Only System

### Flow
1. Admin adds email to `invited_emails` table
2. User tries to sign in with Google
3. After Google auth, a database trigger checks if email is in `invited_emails`
4. If not invited, the signup is rejected
5. If invited, profile is created and user can access the app

### Admin Interface
- Add an "Invitations" section in the admin panel
- Admins can add/remove email addresses from the invite list
- Show pending invites vs. users who have signed up

---

## Part 3: Grocery Inventory Tracking

### New Database Tables

```text
+----------------------+
|  grocery_inventory   |
+----------------------+
| id (uuid)            |
| user_id FK           |
| ingredient_id FK     |
| quantity_on_hand     |
| unit (text)          |
| threshold_quantity   |
| created_at           |
| updated_at           |
+----------------------+
         |
         v
+----------------------+
|   shopping_list      |
+----------------------+
| id (uuid)            |
| user_id FK           |
| ingredient_id FK     |
| quantity_needed      |
| is_purchased (bool)  |
| auto_added (bool)    |
| created_at           |
+----------------------+
```

### Features
1. **Inventory Management**
   - Track current quantity of each ingredient
   - Set low-stock threshold per ingredient
   - Visual indicators for low stock items

2. **Automatic Shopping List**
   - When inventory drops below threshold, auto-add to shopping list
   - Manual add/remove from shopping list
   - Mark items as purchased
   - Clear purchased items

3. **Integration with Meal Logging**
   - Optional: When logging a meal, deduct ingredients from inventory
   - Show warning when trying to log a meal with insufficient ingredients

---

## Implementation Steps

### Phase 1: Database Setup (Migrations)

1. Create new enums and tables:
   - `app_role` enum
   - `user_roles` table
   - `profiles` table
   - `invited_emails` table
   - `grocery_inventory` table
   - `shopping_list` table

2. Create database functions:
   - `has_role(user_id, role)` - security definer for RLS
   - `is_email_invited(email)` - check if email is on invite list
   - `handle_new_user()` - trigger function to create profile on signup
   - `check_inventory_threshold()` - trigger to auto-add to shopping list

3. Update RLS policies on all tables to use `auth.uid()`

### Phase 2: Authentication UI

1. **Create Login Page** (`src/pages/Login.tsx`)
   - Google sign-in button
   - "Not Invited" error state
   - Clean, on-brand design

2. **Create Auth Context** (`src/contexts/AuthContext.tsx`)
   - Session management
   - Auth state listener
   - Sign out function

3. **Update App Routing**
   - Protected routes wrapper
   - Redirect unauthenticated users to login
   - Redirect authenticated users away from login

4. **Update UserProvider**
   - Replace manual user selection with authenticated user
   - Load profile data from `profiles` table

### Phase 3: Admin Invite Management

1. **Create Invitations Page** (`src/pages/Invitations.tsx`)
   - List of invited emails
   - Add new invite form
   - Remove invite button
   - Show status (pending vs. signed up)

2. **Create useInvitations hook**
   - CRUD operations for invited_emails

3. **Add navigation link**
   - Admin-only link in sidebar

### Phase 4: Grocery Inventory Feature

1. **Create Inventory Page** (`src/pages/Inventory.tsx`)
   - Grid of ingredients with stock levels
   - Visual low-stock indicators
   - Edit quantity/threshold modal

2. **Create Shopping List Page** (`src/pages/ShoppingList.tsx`)
   - List of items to buy
   - Checkbox to mark purchased
   - Clear purchased button
   - Manual add item

3. **Create Components:**
   - `InventoryCard.tsx` - shows ingredient with stock level
   - `InventoryForm.tsx` - edit quantity/threshold
   - `ShoppingListItem.tsx` - shopping list row
   - `AddToListModal.tsx` - manual add to shopping list

4. **Create Hooks:**
   - `useInventory.ts` - CRUD for grocery_inventory
   - `useShoppingList.ts` - CRUD for shopping_list

5. **Update Navigation:**
   - Add "Inventory" to nav
   - Add "Shopping List" to nav

### Phase 5: Integration & Polish

1. **Update existing components**
   - Remove UserSelector (no longer needed)
   - Update Header to show current user avatar/email
   - Add sign-out button

2. **Data Migration (optional)**
   - Provide SQL to migrate existing app_users data to new profiles

3. **Testing**
   - Test Google sign-in flow
   - Test invite rejection for non-invited emails
   - Test inventory threshold alerts
   - Test shopping list auto-add

---

## Technical Details

### Files to Create

```text
src/
├── contexts/
│   └── AuthContext.tsx
├── pages/
│   ├── Login.tsx
│   ├── Invitations.tsx
│   ├── Inventory.tsx
│   └── ShoppingList.tsx
├── components/
│   ├── auth/
│   │   ├── GoogleSignInButton.tsx
│   │   └── ProtectedRoute.tsx
│   ├── inventory/
│   │   ├── InventoryCard.tsx
│   │   ├── InventoryForm.tsx
│   │   ├── InventoryGrid.tsx
│   │   └── LowStockAlert.tsx
│   └── shopping/
│       ├── ShoppingListItem.tsx
│       ├── AddToListModal.tsx
│       └── ShoppingListView.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useInvitations.ts
│   ├── useInventory.ts
│   └── useShoppingList.ts
```

### Files to Modify

```text
src/
├── App.tsx (add auth context, protected routes)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx (add inventory/shopping nav, remove UserSelector)
│   │   ├── BottomNav.tsx (add inventory nav)
│   │   └── Header.tsx (show user, add sign-out)
│   └── shared/
│       └── UserProvider.tsx (use auth context)
├── hooks/
│   ├── useIngredients.ts (use auth.uid)
│   ├── useRecipes.ts (use auth.uid)
│   ├── useFoodEntries.ts (use auth.uid)
│   └── useUserSettings.ts (use auth.uid)
├── pages/index.ts (add new pages)
```

---

## User Setup Required

After implementation, you will need to:

1. **Configure Google OAuth in Supabase Dashboard**
   - Go to Authentication > Providers > Google
   - Add your Google Cloud OAuth credentials
   - Set the redirect URL

2. **Set Site URL in Supabase**
   - Go to Authentication > URL Configuration
   - Set Site URL to your app's URL (e.g., `https://nourishlog.lovable.app`)

3. **Add initial admin invite**
   - Run SQL to add your email to `invited_emails` table
   - This allows you to be the first user to sign in

---

## Summary

This implementation transforms NourishLog from a demo app with manual user selection into a production-ready application with:
- Secure Google authentication
- Invite-only access control
- Full data isolation per user
- Grocery inventory tracking with smart restock alerts

