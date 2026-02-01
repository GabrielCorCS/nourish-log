

# Fix: Supabase URL Required Error

## Problem
The app is crashing with "Supabase URL is required" because the Supabase client is trying to use environment variables that aren't available at runtime. There are also two conflicting Supabase client files.

## Solution
Replace environment variable usage with hardcoded Supabase credentials (which is the recommended pattern for Lovable projects) and consolidate to a single Supabase client.

---

## Changes

### 1. Update `src/integrations/supabase/client.ts`
Replace the environment variable approach with hardcoded values:

```typescript
const SUPABASE_URL = "https://tnynamuwaaqquwenkphq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

This is the anon/publishable key which is safe to include in client-side code.

### 2. Update `src/lib/supabase.ts`
Update to import from the canonical client instead of creating a duplicate:

```typescript
export { supabase } from '@/integrations/supabase/client';
export { getCurrentUserId helper function }
```

This consolidates all Supabase usage to a single source.

---

## Why This Works
- The Supabase anon key is designed to be public - it only grants access that RLS policies allow
- Hardcoding removes dependency on environment variables which don't persist correctly
- Single client prevents configuration drift between files

