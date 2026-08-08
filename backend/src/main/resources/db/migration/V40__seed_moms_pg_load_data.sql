-- V40__seed_moms_pg_load_data.sql

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
