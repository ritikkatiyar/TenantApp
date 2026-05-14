-- V9__billing_and_shared_expense_domains.sql
-- Final modular-monolith financial model:
-- 1) owner billing remains lease/rent-cycle centric
-- 2) roommate expense coordination is independent and settlement-oriented

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

CREATE TABLE expense_group_tbl (
    id VARCHAR(36) PRIMARY KEY,
    unit_id VARCHAR(36) NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_expense_group_unit
        FOREIGN KEY (unit_id) REFERENCES unit_tbl(id) ON DELETE RESTRICT,
    CONSTRAINT fk_expense_group_created_by
        FOREIGN KEY (created_by) REFERENCES user_tbl(id) ON DELETE RESTRICT
);

CREATE TABLE expense_tbl (
    id VARCHAR(36) PRIMARY KEY,
    expense_group_id VARCHAR(36) NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    expense_type ENUM('RENT', 'ELECTRICITY', 'WIFI', 'GROCERIES', 'FOOD', 'MAINTENANCE', 'OTHER') NOT NULL,
    description VARCHAR(255),
    billing_month CHAR(7),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_expense_group
        FOREIGN KEY (expense_group_id) REFERENCES expense_group_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_created_by
        FOREIGN KEY (created_by) REFERENCES user_tbl(id) ON DELETE RESTRICT
);

CREATE TABLE expense_split_tbl (
    id VARCHAR(36) PRIMARY KEY,
    expense_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    split_type ENUM('EQUAL', 'PERCENTAGE', 'FIXED', 'CUSTOM', 'ROTATIONAL') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    percentage DECIMAL(5, 2),
    status ENUM('PENDING', 'SETTLED') NOT NULL,
    paid_at DATETIME(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_expense_split_expense
        FOREIGN KEY (expense_id) REFERENCES expense_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_split_user
        FOREIGN KEY (user_id) REFERENCES user_tbl(id) ON DELETE RESTRICT
);

CREATE INDEX idx_rent_cycle_billing_month ON rent_cycle_tbl(billing_month);
CREATE INDEX idx_rent_cycle_charge_cycle_id ON rent_cycle_charge_tbl(rent_cycle_id);
CREATE INDEX idx_expense_group_unit_id ON expense_group_tbl(unit_id);
CREATE INDEX idx_expense_group_created_by ON expense_group_tbl(created_by);
CREATE INDEX idx_expense_group_id ON expense_tbl(expense_group_id);
CREATE INDEX idx_expense_billing_month ON expense_tbl(billing_month);
CREATE INDEX idx_expense_split_expense_id ON expense_split_tbl(expense_id);
CREATE INDEX idx_expense_split_user_status ON expense_split_tbl(user_id, status);
