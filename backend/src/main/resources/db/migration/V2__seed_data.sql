-- V2__seed_data.sql
-- Seed data for TenantLiving / Property Management System

-- 1. Seed Default Super Admin User
INSERT INTO user_tbl (
    id,
    auth_uid,
    full_name,
    phone_number,
    password_hash,
    failed_login_attempts,
    lockout_until,
    global_role
) VALUES (
    '51b21b41-22f7-44a6-ba3e-1e03421d46ea',
    'super@duper.com',
    'SuperDuperMan',
    '9658742346',
    '$2a$10$iF2sCXo.GR6uLLooK5FiHubhCvAY8xAr3mYmCIQDEgFuTvOK/PCzq',
    0,
    NULL,
    'SUPER_ADMIN'
);

-- 2. Seed Subscription Plans with fixed UUIDs
INSERT INTO subscription_plan_tbl (id, plan_key, name, price_monthly, price_yearly, currency, is_active) VALUES
('10000000-0000-0000-0000-000000000001', 'STARTER', 'Starter (Free)', 0.00, 0.00, 'INR', TRUE),
('10000000-0000-0000-0000-000000000002', 'BASIC', 'Basic Landlord', 799.00, 7670.00, 'INR', TRUE),
('10000000-0000-0000-0000-000000000003', 'PREMIUM', 'Premium Portfolio', 1599.00, 15350.00, 'INR', TRUE),
('10000000-0000-0000-0000-000000000004', 'ENTERPRISE', 'Enterprise Unlimited', 3999.00, 38390.00, 'INR', TRUE);

-- 3. Seed Plan Feature Limits using static plan IDs
INSERT INTO plan_feature_limit_tbl (id, plan_id, feature_key, limit_value) VALUES
-- STARTER
(UUID(), '10000000-0000-0000-0000-000000000001', 'MAX_PROPERTIES', 1),
(UUID(), '10000000-0000-0000-0000-000000000001', 'MAX_UNITS', 5),
(UUID(), '10000000-0000-0000-0000-000000000001', 'MAX_TEAM_MEMBERS', 1),
(UUID(), '10000000-0000-0000-0000-000000000001', 'AI_CREDITS_MONTHLY', 50),
(UUID(), '10000000-0000-0000-0000-000000000001', 'COMMAND_CENTER_3D', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'CUSTOM_CHARGE_TYPES', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'BATCH_RENT_GENERATION', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'BILLING_WORKSHEET', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'FINANCIAL_LEDGER', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'PREMIUM_EXPENSE_SPLIT', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'INVOICE_PDF', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'CUSTOM_ROLES', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'FINE_GRAINED_PERMISSIONS', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'TARGETED_ANNOUNCEMENTS', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'ADVANCED_ANALYTICS', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'ADVANCED_REPORTS', 0),
-- BASIC
(UUID(), '10000000-0000-0000-0000-000000000002', 'MAX_PROPERTIES', 3),
(UUID(), '10000000-0000-0000-0000-000000000002', 'MAX_UNITS', 25),
(UUID(), '10000000-0000-0000-0000-000000000002', 'MAX_TEAM_MEMBERS', 3),
(UUID(), '10000000-0000-0000-0000-000000000002', 'AI_CREDITS_MONTHLY', 200),
(UUID(), '10000000-0000-0000-0000-000000000002', 'COMMAND_CENTER_3D', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'CUSTOM_CHARGE_TYPES', 1),
(UUID(), '10000000-0000-0000-0000-000000000002', 'BATCH_RENT_GENERATION', 1),
(UUID(), '10000000-0000-0000-0000-000000000002', 'BILLING_WORKSHEET', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'FINANCIAL_LEDGER', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'PREMIUM_EXPENSE_SPLIT', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'INVOICE_PDF', 1),
(UUID(), '10000000-0000-0000-0000-000000000002', 'CUSTOM_ROLES', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'FINE_GRAINED_PERMISSIONS', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'TARGETED_ANNOUNCEMENTS', 1),
(UUID(), '10000000-0000-0000-0000-000000000002', 'ADVANCED_ANALYTICS', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'ADVANCED_REPORTS', 0),
-- PREMIUM
(UUID(), '10000000-0000-0000-0000-000000000003', 'MAX_PROPERTIES', 10),
(UUID(), '10000000-0000-0000-0000-000000000003', 'MAX_UNITS', 100),
(UUID(), '10000000-0000-0000-0000-000000000003', 'MAX_TEAM_MEMBERS', 10),
(UUID(), '10000000-0000-0000-0000-000000000003', 'AI_CREDITS_MONTHLY', 1000),
(UUID(), '10000000-0000-0000-0000-000000000003', 'COMMAND_CENTER_3D', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'CUSTOM_CHARGE_TYPES', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'BATCH_RENT_GENERATION', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'BILLING_WORKSHEET', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'FINANCIAL_LEDGER', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'PREMIUM_EXPENSE_SPLIT', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'INVOICE_PDF', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'CUSTOM_ROLES', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'FINE_GRAINED_PERMISSIONS', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'TARGETED_ANNOUNCEMENTS', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'ADVANCED_ANALYTICS', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'ADVANCED_REPORTS', 1),
-- ENTERPRISE
(UUID(), '10000000-0000-0000-0000-000000000004', 'MAX_PROPERTIES', -1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'MAX_UNITS', -1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'MAX_TEAM_MEMBERS', -1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'AI_CREDITS_MONTHLY', -1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'COMMAND_CENTER_3D', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'CUSTOM_CHARGE_TYPES', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'BATCH_RENT_GENERATION', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'BILLING_WORKSHEET', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'FINANCIAL_LEDGER', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'PREMIUM_EXPENSE_SPLIT', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'INVOICE_PDF', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'CUSTOM_ROLES', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'FINE_GRAINED_PERMISSIONS', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'TARGETED_ANNOUNCEMENTS', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'ADVANCED_ANALYTICS', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'ADVANCED_REPORTS', 1);

-- 4. Seed Initial Roles
INSERT INTO membership_role_tbl (id, code, name, description) VALUES
('40000000-0000-0000-0000-000000000001', 'PROPERTY_OWNER', 'Property Owner', 'Full access to property'),
('40000000-0000-0000-0000-000000000002', 'PROPERTY_MANAGER', 'Property Manager', 'Operational access to property'),
('40000000-0000-0000-0000-000000000003', 'PROPERTY_TENANT', 'Tenant', 'Limited access to own lease and property details'),
('40000000-0000-0000-0000-000000000004', 'PROPERTY_CARETAKER', 'Caretaker', 'Day to day operations access');

-- 5. Seed Permissions
INSERT INTO permission_tbl (id, code, description) VALUES
(UUID(), 'PROPERTY_VIEW', 'Can view property details'),
(UUID(), 'PROPERTY_EDIT', 'Can edit property details'),
(UUID(), 'PROPERTY_DELETE', 'Can delete property'),
(UUID(), 'LEASE_CREATE', 'Can create leases'),
(UUID(), 'LEASE_UPDATE', 'Can update leases'),
(UUID(), 'LEASE_VIEW', 'Can view all leases'),
(UUID(), 'LEASE_VIEW_OWN', 'Can view own lease'),
(UUID(), 'EXPENSE_CREATE', 'Can create expenses'),
(UUID(), 'EXPENSE_APPROVE', 'Can approve expenses'),
(UUID(), 'PAYMENT_VIEW', 'Can view all payments'),
(UUID(), 'PAYMENT_CREATE_OWN', 'Can create own payments'),
(UUID(), 'ANNOUNCEMENT_CREATE', 'Can create announcements'),
(UUID(), 'MANAGE_STAFF', 'Can assign/remove manager and caretaker roles on property'),
(UUID(), 'PROPERTY_VIEW_OWN_LEASE', 'Can view own lease details as tenant');

-- 6. Map Role Permissions
-- Map all permissions to OWNER
INSERT INTO role_permission_tbl (id, role_id, permission_id)
SELECT UUID(), '40000000-0000-0000-0000-000000000001', id FROM permission_tbl;

-- Map permissions to MANAGER
INSERT INTO role_permission_tbl (id, role_id, permission_id)
SELECT UUID(), '40000000-0000-0000-0000-000000000002', id FROM permission_tbl
WHERE code IN ('PROPERTY_VIEW', 'LEASE_CREATE', 'LEASE_UPDATE', 'LEASE_VIEW', 'EXPENSE_CREATE', 'PAYMENT_VIEW', 'ANNOUNCEMENT_CREATE');

-- Map permissions to TENANT
INSERT INTO role_permission_tbl (id, role_id, permission_id)
SELECT UUID(), '40000000-0000-0000-0000-000000000003', id FROM permission_tbl
WHERE code IN ('PROPERTY_VIEW', 'LEASE_VIEW_OWN', 'PAYMENT_CREATE_OWN', 'PROPERTY_VIEW_OWN_LEASE');

-- Map permissions to CARETAKER
INSERT INTO role_permission_tbl (id, role_id, permission_id)
SELECT UUID(), '40000000-0000-0000-0000-000000000004', id FROM permission_tbl
WHERE code IN ('PROPERTY_VIEW', 'ANNOUNCEMENT_CREATE');


-- 7. Seed Mom's PG Load Stored Procedure
DELIMITER //

CREATE PROCEDURE seed_moms_pg_load_data()
BEGIN
    DECLARE owner_id VARCHAR(36);
    DECLARE manager_id VARCHAR(36);
    DECLARE caretaker_id VARCHAR(36);
    
    DECLARE owner_role_id VARCHAR(36);
    DECLARE manager_role_id VARCHAR(36);
    DECLARE caretaker_role_id VARCHAR(36);
    DECLARE tenant_role_id VARCHAR(36);
    DECLARE password_hash VARCHAR(255);
    
    DECLARE b INT DEFAULT 1;
    DECLARE f INT DEFAULT 1;
    DECLARE r INT DEFAULT 1;
    
    DECLARE prop_id VARCHAR(36);
    DECLARE unit_num VARCHAR(10);
    DECLARE curr_unit_id VARCHAR(36);
    DECLARE curr_tenant_id VARCHAR(36);
    
    SET owner_id = 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e';
    SET manager_id = 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f';
    SET caretaker_id = 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a';
    SET password_hash = '$2a$10$iF2sCXo.GR6uLLooK5FiHubhCvAY8xAr3mYmCIQDEgFuTvOK/PCzq'; -- 'Adm!n@super'
    
    -- Retrieve role IDs
    SELECT id INTO owner_role_id FROM membership_role_tbl WHERE code = 'PROPERTY_OWNER' LIMIT 1;
    SELECT id INTO manager_role_id FROM membership_role_tbl WHERE code = 'PROPERTY_MANAGER' LIMIT 1;
    SELECT id INTO caretaker_role_id FROM membership_role_tbl WHERE code = 'PROPERTY_CARETAKER' LIMIT 1;
    SELECT id INTO tenant_role_id FROM membership_role_tbl WHERE code = 'PROPERTY_TENANT' LIMIT 1;
    
    -- 1. Insert Owner, Manager, Caretaker Users
    INSERT INTO user_tbl (id, auth_uid, full_name, phone_number, password_hash, global_role) VALUES
    (owner_id, 'owner@moms.com', 'Mom\'s Owner', '9999999991', password_hash, 'USER'),
    (manager_id, 'manager@moms.com', 'Mom\'s Manager', '9999999992', password_hash, 'USER'),
    (caretaker_id, 'caretaker@moms.com', 'Mom\'s Caretaker', '9999999993', password_hash, 'USER');
    
    -- 2. Add User Preferences for Dashboard Active Modes
    INSERT INTO user_preference_tbl (id, user_id, active_mode, onboarding_done) VALUES
    (UUID(), owner_id, 'RENTAL', TRUE),
    (UUID(), manager_id, 'RENTAL', TRUE),
    (UUID(), caretaker_id, 'RENTAL', TRUE);
    
    -- 3. Loop 10 Buildings
    WHILE b <= 10 DO
        SET prop_id = UUID();
        
        -- Insert Property
        INSERT INTO property_tbl (id, name, city, address, total_floors, property_type, is_active, allow_partial_payment, auto_bill_day_of_month, auto_bill_time)
        VALUES (prop_id, CONCAT('mom\'s pg ', b), 'New York', CONCAT('Address Building ', b), 5, 'RENTAL', TRUE, TRUE, 1, '09:00:00');
        
        -- Map Owner, Manager, Caretaker to this specific Building
        INSERT INTO membership_tbl (id, user_id, property_id, role_id) VALUES
        (UUID(), owner_id, prop_id, owner_role_id),
        (UUID(), manager_id, prop_id, manager_role_id),
        (UUID(), caretaker_id, prop_id, caretaker_role_id);
        
        -- Insert Base Rent Charge Configuration for this Building
        INSERT INTO charge_config_tbl (id, property_id, charge_name, charge_category, billing_frequency, calculation_strategy, base_rate, apply_sales_tax, is_system_required, is_active, auto_carry_forward)
        VALUES (UUID(), prop_id, 'Base Rent', 'RENT', 'MONTHLY', 'FIXED_RATE', NULL, FALSE, TRUE, TRUE, FALSE);
        
        -- Loop 5 Floors
        SET f = 1;
        WHILE f <= 5 DO
            -- Loop 20 Rooms per floor
            SET r = 1;
            WHILE r <= 20 DO
                SET unit_num = CONCAT(f, LPAD(r, 2, '0'));
                SET curr_unit_id = UUID();
                
                -- Create Unit
                INSERT INTO unit_tbl (id, property_id, unit_number, floor, capacity, type, grid_x, grid_y, grid_width, grid_height)
                VALUES (curr_unit_id, prop_id, unit_num, f, 2, 'SHARED_UNIT', r, f, 1, 1);
                
                -- Create Tenant 1 for this unit
                SET curr_tenant_id = UUID();
                INSERT INTO user_tbl (id, auth_uid, full_name, phone_number, password_hash, global_role)
                VALUES (curr_tenant_id, CONCAT('tenant_', b, '_', f, '_', r, '_1@moms.com'), CONCAT('Tenant ', b, '-', unit_num, ' A'), CONCAT('9', LPAD(b, 2, '0'), f, LPAD(r, 2, '0'), '1'), password_hash, 'USER');
                
                INSERT INTO membership_tbl (id, user_id, property_id, role_id)
                VALUES (UUID(), curr_tenant_id, prop_id, tenant_role_id);
                
                INSERT INTO lease_tbl (id, unit_id, user_id, monthly_rent_amount, security_deposit, move_in_date, status, split_strategy)
                VALUES (UUID(), curr_unit_id, curr_tenant_id, 1000.00, 2000.00, '2026-08-01', 'ACTIVE', 'FULL_UNIT');
                
                -- Create Tenant 2 for this unit
                SET curr_tenant_id = UUID();
                INSERT INTO user_tbl (id, auth_uid, full_name, phone_number, password_hash, global_role)
                VALUES (curr_tenant_id, CONCAT('tenant_', b, '_', f, '_', r, '_2@moms.com'), CONCAT('Tenant ', b, '-', unit_num, ' B'), CONCAT('9', LPAD(b, 2, '0'), f, LPAD(r, 2, '0'), '2'), password_hash, 'USER');
                
                INSERT INTO membership_tbl (id, user_id, property_id, role_id)
                VALUES (UUID(), curr_tenant_id, prop_id, tenant_role_id);
                
                INSERT INTO lease_tbl (id, unit_id, user_id, monthly_rent_amount, security_deposit, move_in_date, status, split_strategy)
                VALUES (UUID(), curr_unit_id, curr_tenant_id, 1000.00, 2000.00, '2026-08-01', 'ACTIVE', 'FULL_UNIT');
                
                SET r = r + 1;
            END WHILE;
            SET f = f + 1;
        END WHILE;
        
        SET b = b + 1;
    END WHILE;
END //

DELIMITER ;

CALL seed_moms_pg_load_data();
DROP PROCEDURE seed_moms_pg_load_data;
