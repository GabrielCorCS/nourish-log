-- NourishLog Seed Data
-- Run this after schema.sql in Supabase SQL Editor

-- ============================================
-- SEED ADMIN USER
-- ============================================
INSERT INTO app_users (email, name, avatar_emoji, is_admin) VALUES
('gabrielcordova.wk@gmail.com', 'Gabriel', '👑', true);

-- ============================================
-- SEED INGREDIENTS (40 common ingredients)
-- ============================================
-- These are default ingredients available to all users
INSERT INTO ingredients (name, emoji, category, serving_size, serving_unit, calories, protein, carbs, fat, is_default) VALUES
-- Proteins (10)
('Chicken Breast', '🍗', 'proteins', 100, 'g', 165, 31, 0, 3.6, true),
('Salmon Fillet', '🐟', 'proteins', 100, 'g', 208, 20, 0, 13, true),
('Ground Beef (90% lean)', '🥩', 'proteins', 100, 'g', 176, 20, 0, 10, true),
('Eggs', '🥚', 'proteins', 1, 'piece', 72, 6, 0.4, 5, true),
('Tofu (firm)', '🧈', 'proteins', 100, 'g', 144, 17, 3, 8, true),
('Shrimp', '🍤', 'proteins', 100, 'g', 99, 24, 0.2, 0.3, true),
('Turkey Breast', '🦃', 'proteins', 100, 'g', 135, 30, 0, 1, true),
('Tuna (canned)', '🐟', 'proteins', 100, 'g', 116, 26, 0, 1, true),
('Pork Tenderloin', '🥓', 'proteins', 100, 'g', 143, 26, 0, 3.5, true),
('Greek Yogurt', '🥛', 'proteins', 150, 'g', 100, 17, 6, 0.7, true),
-- Grains (6)
('Brown Rice (cooked)', '🍚', 'grains', 100, 'g', 112, 2.6, 24, 0.9, true),
('Quinoa (cooked)', '🌾', 'grains', 100, 'g', 120, 4.4, 21, 1.9, true),
('Oats (rolled)', '🥣', 'grains', 40, 'g', 152, 5.3, 27, 2.7, true),
('Whole Wheat Bread', '🍞', 'grains', 1, 'slice', 81, 4, 14, 1.1, true),
('Pasta (cooked)', '🍝', 'grains', 100, 'g', 131, 5, 25, 1.1, true),
('White Rice (cooked)', '🍚', 'grains', 100, 'g', 130, 2.7, 28, 0.3, true),
-- Vegetables (8)
('Broccoli', '🥦', 'vegetables', 100, 'g', 34, 2.8, 7, 0.4, true),
('Spinach', '🥬', 'vegetables', 100, 'g', 23, 2.9, 3.6, 0.4, true),
('Sweet Potato', '🍠', 'vegetables', 100, 'g', 86, 1.6, 20, 0.1, true),
('Bell Pepper', '🫑', 'vegetables', 100, 'g', 31, 1, 6, 0.3, true),
('Carrots', '🥕', 'vegetables', 100, 'g', 41, 0.9, 10, 0.2, true),
('Tomatoes', '🍅', 'vegetables', 100, 'g', 18, 0.9, 3.9, 0.2, true),
('Zucchini', '🥒', 'vegetables', 100, 'g', 17, 1.2, 3.1, 0.3, true),
('Kale', '🥬', 'vegetables', 100, 'g', 35, 2.9, 4.4, 1.5, true),
-- Fruits (5)
('Banana', '🍌', 'fruits', 1, 'piece', 105, 1.3, 27, 0.4, true),
('Apple', '🍎', 'fruits', 1, 'piece', 95, 0.5, 25, 0.3, true),
('Blueberries', '🫐', 'fruits', 100, 'g', 57, 0.7, 14, 0.3, true),
('Avocado', '🥑', 'fruits', 100, 'g', 160, 2, 9, 15, true),
('Orange', '🍊', 'fruits', 1, 'piece', 62, 1.2, 15, 0.2, true),
-- Dairy (3)
('Milk (2%)', '🥛', 'dairy', 240, 'ml', 122, 8, 12, 5, true),
('Cheddar Cheese', '🧀', 'dairy', 30, 'g', 113, 7, 0.4, 9, true),
('Cottage Cheese', '🧈', 'dairy', 100, 'g', 98, 11, 3.4, 4.3, true),
-- Fats & Oils (3)
('Olive Oil', '🫒', 'fats', 1, 'tbsp', 119, 0, 0, 13.5, true),
('Butter', '🧈', 'fats', 1, 'tbsp', 102, 0.1, 0, 12, true),
('Coconut Oil', '🥥', 'fats', 1, 'tbsp', 121, 0, 0, 13.5, true),
-- Legumes (3)
('Black Beans (cooked)', '🫘', 'legumes', 100, 'g', 132, 8.9, 24, 0.5, true),
('Lentils (cooked)', '🫘', 'legumes', 100, 'g', 116, 9, 20, 0.4, true),
('Chickpeas (cooked)', '🫘', 'legumes', 100, 'g', 164, 8.9, 27, 2.6, true),
-- Nuts (2)
('Almonds', '🥜', 'nuts', 30, 'g', 173, 6, 6, 15, true),
('Peanut Butter', '🥜', 'nuts', 2, 'tbsp', 188, 8, 6, 16, true);
