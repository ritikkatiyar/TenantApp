-- V22__fix_enum_and_add_missing_permissions.sql

-- 1. Modify user_tbl.global_role enum to remove PROPERTY_STAFF
ALTER TABLE user_tbl MODIFY COLUMN global_role ENUM('USER', 'SUPER_ADMIN', 'ADMIN') NOT NULL DEFAULT 'USER';

-- 2. Insert missing permissions
INSERT INTO permission_tbl (id, code, description) VALUES
    (UUID(), 'MANAGE_STAFF', 'Can assign/remove manager and caretaker roles on property'),
    (UUID(), 'PROPERTY_VIEW_OWN_LEASE', 'Can view own lease details as tenant');

-- 3. Insert PROPERTY_CARETAKER role
INSERT INTO membership_role_tbl (id, code, name, description) VALUES
    (UUID(), 'PROPERTY_CARETAKER', 'Caretaker', 'Day to day operations access');

-- 4. Grant MANAGE_STAFF to PROPERTY_OWNER
INSERT INTO role_permission_tbl (id, role_id, permission_id)
SELECT UUID(), r.id, p.id
FROM membership_role_tbl r
JOIN permission_tbl p ON 1=1
WHERE r.code = 'PROPERTY_OWNER' AND p.code = 'MANAGE_STAFF';

-- 5. Grant PROPERTY_VIEW_OWN_LEASE to PROPERTY_TENANT
INSERT INTO role_permission_tbl (id, role_id, permission_id)
SELECT UUID(), r.id, p.id
FROM membership_role_tbl r
JOIN permission_tbl p ON 1=1
WHERE r.code = 'PROPERTY_TENANT' AND p.code = 'PROPERTY_VIEW_OWN_LEASE';

-- 6. Grant PROPERTY_VIEW and ANNOUNCEMENT_CREATE to PROPERTY_CARETAKER
INSERT INTO role_permission_tbl (id, role_id, permission_id)
SELECT UUID(), r.id, p.id
FROM membership_role_tbl r
JOIN permission_tbl p ON 1=1
WHERE r.code = 'PROPERTY_CARETAKER' AND p.code IN ('PROPERTY_VIEW', 'ANNOUNCEMENT_CREATE');
