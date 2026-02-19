-- Extend user roles for RBAC: admin, manager, sales, support, readonly.
-- Keep 'ventas' in CHECK for backward compatibility; app maps ventas -> sales in session.
-- Reversible: run down migration to restore original CHECK and optionally revert data.

-- Step 1: Drop existing role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Allow new roles (ventas kept for backward compatibility)
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN ('admin', 'ventas', 'manager', 'sales', 'support', 'readonly')
);

-- Step 3 (optional): Migrate existing ventas to sales so new logic uses 'sales'
UPDATE users SET role = 'sales' WHERE role = 'ventas';

-- Down migration (for rollback):
-- UPDATE users SET role = 'ventas' WHERE role = 'sales';
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'ventas'));
