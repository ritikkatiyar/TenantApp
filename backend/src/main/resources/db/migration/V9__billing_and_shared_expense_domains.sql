-- V9__billing_and_shared_expense_domains.sql
-- Final modular-monolith financial model:
-- 1) owner billing remains lease/rent-cycle centric

ALTER TABLE lease_tbl
    ADD COLUMN security_deposit DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN split_strategy ENUM('FULL_UNIT', 'PER_OCCUPANT', 'CUSTOM') NOT NULL DEFAULT 'FULL_UNIT';

ALTER TABLE rent_cycle_tbl
    RENAME COLUMN month TO billing_month,
    RENAME COLUMN amount TO base_amount;

ALTER TABLE rent_cycle_tbl
    ADD COLUMN total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

UPDATE rent_cycle_tbl
SET total_amount = base_amount
WHERE total_amount = 0.00;

CREATE UNIQUE INDEX uk_rent_cycle_lease_billing_month
    ON rent_cycle_tbl (lease_id, billing_month);

CREATE TABLE rent_cycle_charge_tbl (
    id VARCHAR(36) PRIMARY KEY,
    rent_cycle_id VARCHAR(36) NOT NULL,
    charge_type ENUM('BASE_RENT', 'ELECTRICITY', 'FOOD', 'MAINTENANCE', 'PENALTY', 'DISCOUNT') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_rent_cycle_charge_cycle
        FOREIGN KEY (rent_cycle_id) REFERENCES rent_cycle_tbl(id) ON DELETE CASCADE
);

INSERT INTO rent_cycle_charge_tbl (id, rent_cycle_id, charge_type, amount, description)
SELECT UUID(), id, 'BASE_RENT', base_amount, 'Owner-level base rent'
FROM rent_cycle_tbl;

CREATE INDEX idx_rent_cycle_billing_month ON rent_cycle_tbl(billing_month);
CREATE INDEX idx_rent_cycle_charge_cycle_id ON rent_cycle_charge_tbl(rent_cycle_id);
