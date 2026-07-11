-- 1. Add active status to properties
ALTER TABLE property_tbl ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Modify active_mode enum in user_preference_tbl to support INDIVIDUAL
ALTER TABLE user_preference_tbl MODIFY COLUMN active_mode ENUM('RENTAL', 'HOSTEL', 'MESS', 'SOCIETY', 'INDIVIDUAL') NOT NULL DEFAULT 'RENTAL';

-- 3. Modify base_rate in charge_config_tbl to be optional (nullable)
ALTER TABLE charge_config_tbl MODIFY COLUMN base_rate DECIMAL(10, 2) NULL;
