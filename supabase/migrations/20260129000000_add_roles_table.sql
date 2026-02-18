-- ============================================================================
-- MIGRATION: Add roles table
-- Description: Replace fixed role CHECK constraint with a roles lookup table
--              for flexibility in adding/renaming roles
-- ============================================================================

-- 1. Create the roles table
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read roles (needed for joins)
CREATE POLICY "Roles are viewable by authenticated users"
    ON public.roles
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Insert default roles
INSERT INTO public.roles (name, description) VALUES
    ('superadmin', 'Full system access to all fleets and data'),
    ('admin', 'Fleet-level admin with management capabilities'),
    ('user', 'Regular user access limited to their fleet'),
    ('viewer', 'Read-only access to fleet data');

-- 3. Add role_id column to user_profiles
ALTER TABLE public.user_profiles
    ADD COLUMN role_id INTEGER;

-- 4. Migrate existing role data to role_id
UPDATE public.user_profiles up
SET role_id = r.id
FROM public.roles r
WHERE up.role = r.name;

-- 5. Set default role_id for any NULL values (default to 'user' role)
UPDATE public.user_profiles
SET role_id = (SELECT id FROM public.roles WHERE name = 'user')
WHERE role_id IS NULL;

-- 6. Make role_id NOT NULL and add foreign key constraint
ALTER TABLE public.user_profiles
    ALTER COLUMN role_id SET NOT NULL,
    ADD CONSTRAINT user_profiles_role_id_fkey
        FOREIGN KEY (role_id) REFERENCES public.roles(id);

-- 7. Drop the old role column and its CHECK constraint
ALTER TABLE public.user_profiles
    DROP COLUMN role;

-- 8. Update is_superadmin() function to use the new roles table
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      SELECT r.name = 'superadmin'
      FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
    ),
    false
  );
$$;

-- 9. Create helper function to get user role name
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT r.name
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid();
$$;

-- 10. Create helper function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      SELECT r.name = role_name
      FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
    ),
    false
  );
$$;

-- 11. Create index for better join performance
CREATE INDEX idx_user_profiles_role_id ON public.user_profiles(role_id);
