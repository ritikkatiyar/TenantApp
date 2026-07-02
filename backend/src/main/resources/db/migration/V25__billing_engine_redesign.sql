-- V23__billing_engine_redesign.sql

-- 1. Create finance_ledger_tbl
CREATE TABLE finance_ledger_tbl (
    id VARCHAR(36) PRIMARY KEY,
    unit_id VARCHAR(36) NOT NULL,
    lease_id VARCHAR(36),
    transaction_type ENUM('INVOICE_GENERATED', 'PAYMENT_RECEIVED', 'LATE_FEE_APPLIED', 'REFUND', 'ADJUSTMENT') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    balance DECIMAL(10, 2) NOT NULL,
    reference_id VARCHAR(36),
    description VARCHAR(255),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_ledger_unit FOREIGN KEY (unit_id) REFERENCES unit_tbl(id),
    CONSTRAINT fk_ledger_lease FOREIGN KEY (lease_id) REFERENCES lease_tbl(id)
);

-- 2. Add auto_carry_forward to charge_config_tbl
ALTER TABLE charge_config_tbl ADD COLUMN auto_carry_forward BOOLEAN NOT NULL DEFAULT FALSE;

-- 2.1 Add auto-billing settings to property_tbl
ALTER TABLE property_tbl 
    ADD COLUMN auto_bill_day_of_month INT,
    ADD COLUMN auto_bill_time TIME;

-- 3. Refine billing worksheet entry (previously meter reading)
RENAME TABLE meter_reading_tbl TO billing_worksheet_entry_tbl;

ALTER TABLE billing_worksheet_entry_tbl
    DROP COLUMN previous_reading,
    DROP COLUMN current_reading,
    ADD COLUMN entered_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN created_by VARCHAR(36) NOT NULL;

ALTER TABLE billing_worksheet_entry_tbl ADD INDEX fk_meter_unit_idx (unit_id);
ALTER TABLE billing_worksheet_entry_tbl DROP INDEX uk_meter_reading;

ALTER TABLE billing_worksheet_entry_tbl ADD COLUMN billing_period CHAR(7);
UPDATE billing_worksheet_entry_tbl SET billing_period = CONCAT(billing_year, '-', LPAD(billing_month, 2, '0'));
ALTER TABLE billing_worksheet_entry_tbl DROP COLUMN billing_month;
ALTER TABLE billing_worksheet_entry_tbl DROP COLUMN billing_year;
ALTER TABLE billing_worksheet_entry_tbl CHANGE COLUMN billing_period billing_month CHAR(7) NOT NULL;

ALTER TABLE billing_worksheet_entry_tbl ADD CONSTRAINT uk_billing_worksheet_entry UNIQUE (unit_id, charge_config_id, billing_month);



-- 6. Remove rent_amount from lease_tbl
ALTER TABLE lease_tbl DROP COLUMN rent_amount;

-- 7. Update rent_cycle_tbl base amount
ALTER TABLE rent_cycle_tbl DROP COLUMN base_amount;
