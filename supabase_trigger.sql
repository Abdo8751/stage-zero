-- ============================================================
-- Run this in Supabase SQL Editor → SQL Editor → New query
-- ============================================================

-- Drop existing trigger first (safe to re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate with exception handler so a profile insert failure
-- NEVER blocks the auth signup from completing.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name, is_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'founder'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'founder') = 'founder'
      THEN true
      ELSE false
    END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Profile creation failed but auth user must still be created.
  -- The /api/auth/setup-profile route will fix the profile on redirect.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
