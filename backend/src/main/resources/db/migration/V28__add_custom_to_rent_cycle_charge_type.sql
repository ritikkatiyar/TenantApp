-- V28__add_custom_to_rent_cycle_charge_type.sql
-- Add CUSTOM value to rent_cycle_charge_tbl.charge_type ENUM

ALTER TABLE rent_cycle_charge_tbl
    MODIFY COLUMN charge_type ENUM('BASE_RENT', 'ELECTRICITY', 'FOOD', 'MAINTENANCE', 'PENALTY', 'DISCOUNT', 'CUSTOM') NOT NULL;
