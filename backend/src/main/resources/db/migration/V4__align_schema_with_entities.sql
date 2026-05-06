-- V4__align_schema_with_entities.sql
-- Align schema with current JPA entities while remaining safe for existing rows.

-- user_tbl: full_name is now required at entity level.
UPDATE user_tbl
SET full_name = COALESCE(NULLIF(TRIM(full_name), ''), 'Unknown User')
WHERE full_name IS NULL OR TRIM(full_name) = '';

ALTER TABLE user_tbl
    MODIFY COLUMN full_name VARCHAR(255) NOT NULL;

-- user_tbl: phone_number is marked unique in entity.
CREATE UNIQUE INDEX uk_user_tbl_phone_number ON user_tbl (phone_number);

-- unit_tbl: add grid coordinates introduced in UnitTbl.
ALTER TABLE unit_tbl
    ADD COLUMN grid_x INT NOT NULL DEFAULT 0,
    ADD COLUMN grid_y INT NOT NULL DEFAULT 0;

-- unit_tbl: enforce per-property unit number uniqueness from entity constraint.
CREATE UNIQUE INDEX uk_unit_tbl_property_unit_number ON unit_tbl (property_id, unit_number);
