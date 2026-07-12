-- Migration: V33__property_scoped_roles_schema.sql

-- 1. Add property_id, role_rank, and is_active to membership_role_tbl
ALTER TABLE membership_role_tbl 
    ADD COLUMN property_id VARCHAR(36) NULL,
    ADD COLUMN role_rank INT NOT NULL DEFAULT 30,
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD CONSTRAINT fk_membership_role_property FOREIGN KEY (property_id) REFERENCES property_tbl(id) ON DELETE CASCADE;

-- 2. Modify unique constraint to allow same role code to be customized per property
ALTER TABLE membership_role_tbl DROP INDEX code;
ALTER TABLE membership_role_tbl ADD UNIQUE KEY uq_role_code_property (code, property_id);

-- 3. Set default ranks for seeded global roles
UPDATE membership_role_tbl SET role_rank = 100 WHERE code = 'PROPERTY_OWNER';
UPDATE membership_role_tbl SET role_rank = 50 WHERE code = 'PROPERTY_MANAGER';
UPDATE membership_role_tbl SET role_rank = 20 WHERE code = 'PROPERTY_CARETAKER';
UPDATE membership_role_tbl SET role_rank = 10 WHERE code = 'PROPERTY_TENANT';

-- 4. Create property_join_code_tbl
CREATE TABLE property_join_code_tbl (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    created_by VARCHAR(36) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_uses INT NOT NULL DEFAULT 1,
    uses_count INT NOT NULL DEFAULT 0,
    expires_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_join_code_property FOREIGN KEY (property_id) REFERENCES property_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_join_code_role FOREIGN KEY (role_id) REFERENCES membership_role_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_join_code_created_by FOREIGN KEY (created_by) REFERENCES user_tbl(id) ON DELETE CASCADE
);

CREATE INDEX idx_join_code_lookup ON property_join_code_tbl(code);
