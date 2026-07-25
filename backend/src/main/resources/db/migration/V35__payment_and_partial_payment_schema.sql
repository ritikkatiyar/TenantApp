-- V35__payment_and_partial_payment_schema.sql

-- 1. Drop the existing payment_transaction_tbl
DROP TABLE IF EXISTS payment_transaction_tbl;

-- 2. Create the new payment_transaction_tbl
CREATE TABLE payment_transaction_tbl (
    id VARCHAR(36) PRIMARY KEY,
    payer_user_id VARCHAR(36) NOT NULL,
    payment_method VARCHAR(32) NOT NULL, -- ONLINE, CASH, BANK_TRANSFER
    reference_type VARCHAR(32) NOT NULL, -- RENT_CYCLE, SUBSCRIPTION, WALLET_TOPUP, UNIT_BOOKING
    reference_id VARCHAR(36) NOT NULL,
    gateway_name VARCHAR(50),
    gateway_transaction_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL, -- INITIATED, PENDING_CONFIRMATION, SUCCESS, FAILED, REJECTED
    webhook_payload JSON,
    confirmed_by VARCHAR(36),
    confirmed_at DATETIME(6),
    note TEXT,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_payment_tx_payer FOREIGN KEY (payer_user_id) REFERENCES user_tbl(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_tx_confirmed FOREIGN KEY (confirmed_by) REFERENCES user_tbl(id) ON DELETE RESTRICT
);

-- 3. Create payment_webhook_event_tbl
CREATE TABLE payment_webhook_event_tbl (
    id VARCHAR(36) PRIMARY KEY,
    gateway_name VARCHAR(50) NOT NULL,
    gateway_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    processed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

-- 4. Alter property_tbl
ALTER TABLE property_tbl ADD COLUMN allow_partial_payment BOOLEAN NOT NULL DEFAULT FALSE;

-- 5. Alter rent_cycle_tbl
ALTER TABLE rent_cycle_tbl MODIFY COLUMN status ENUM('PENDING', 'PAID', 'OVERDUE', 'PUBLISHED', 'PARTIALLY_PAID') NOT NULL;
ALTER TABLE rent_cycle_tbl ADD COLUMN amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE rent_cycle_tbl ADD COLUMN payment_transaction_id VARCHAR(36);
ALTER TABLE rent_cycle_tbl ADD CONSTRAINT fk_rent_cycle_payment_tx FOREIGN KEY (payment_transaction_id) REFERENCES payment_transaction_tbl(id) ON DELETE SET NULL;

-- 6. Create unit_booking_tbl
CREATE TABLE unit_booking_tbl (
    id VARCHAR(36) PRIMARY KEY,
    unit_id VARCHAR(36) NOT NULL,
    prospective_tenant_user_id VARCHAR(36),
    prospective_tenant_name VARCHAR(255) NOT NULL,
    prospective_tenant_phone VARCHAR(32) NOT NULL,
    prospective_tenant_email VARCHAR(255),
    token_amount DECIMAL(10, 2) NOT NULL,
    expected_move_in_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL, -- BOOKED, CONVERTED, FORFEITED, REFUNDED
    payment_transaction_id VARCHAR(36),
    converted_lease_id VARCHAR(36),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_unit_booking_unit FOREIGN KEY (unit_id) REFERENCES unit_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_unit_booking_user FOREIGN KEY (prospective_tenant_user_id) REFERENCES user_tbl(id) ON DELETE SET NULL,
    CONSTRAINT fk_unit_booking_payment FOREIGN KEY (payment_transaction_id) REFERENCES payment_transaction_tbl(id) ON DELETE SET NULL,
    CONSTRAINT fk_unit_booking_lease FOREIGN KEY (converted_lease_id) REFERENCES lease_tbl(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_payment_tx_payer ON payment_transaction_tbl(payer_user_id);
CREATE INDEX idx_payment_tx_reference ON payment_transaction_tbl(reference_type, reference_id);
CREATE INDEX idx_unit_booking_unit ON unit_booking_tbl(unit_id);
CREATE INDEX idx_unit_booking_user ON unit_booking_tbl(prospective_tenant_user_id);
