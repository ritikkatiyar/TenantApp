-- V13__saas_billing_and_payment_schema.sql

CREATE TABLE saas_subscription_tbl (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plan_name VARCHAR(50) NOT NULL, -- 'STARTER', 'LANDLORD_PRO', 'ENTERPRISE'
    status VARCHAR(30) NOT NULL,    -- 'ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING'
    price DECIMAL(10, 2) NOT NULL,
    current_period_start DATETIME(6) NOT NULL,
    current_period_end DATETIME(6) NOT NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    gateway_subscription_id VARCHAR(255),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_saas_sub_user FOREIGN KEY (user_id) REFERENCES user_tbl(id) ON DELETE RESTRICT
);

CREATE TABLE billing_wallet_tbl (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    credit_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    last_topped_up DATETIME(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_billing_wallet_user FOREIGN KEY (user_id) REFERENCES user_tbl(id) ON DELETE RESTRICT
);

CREATE TABLE wallet_transaction_tbl (
    id VARCHAR(36) PRIMARY KEY,
    wallet_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 4) NOT NULL, -- Supporting tiny fractional credits
    transaction_type ENUM('CREDIT', 'DEBIT') NOT NULL,
    reason VARCHAR(100) NOT NULL, -- e.g., 'WALLET_TOPUP', 'AI_LEASE_ANALYSIS', 'MONTHLY_ALLOCATION'
    reference_id VARCHAR(255),    -- Reference to the AI job ID or Payment Transaction ID
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_wallet_tx_wallet FOREIGN KEY (wallet_id) REFERENCES billing_wallet_tbl(id) ON DELETE CASCADE
);

CREATE TABLE payment_transaction_tbl (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    subscription_id VARCHAR(36),
    gateway_name ENUM('STRIPE', 'RAZORPAY', 'PAYPAL') NOT NULL,
    gateway_transaction_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL,
    webhook_payload JSON,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_payment_tx_user FOREIGN KEY (user_id) REFERENCES user_tbl(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_tx_sub FOREIGN KEY (subscription_id) REFERENCES saas_subscription_tbl(id) ON DELETE SET NULL
);

CREATE INDEX idx_saas_sub_user ON saas_subscription_tbl(user_id);
CREATE INDEX idx_wallet_tx_wallet ON wallet_transaction_tbl(wallet_id);
CREATE INDEX idx_payment_tx_user ON payment_transaction_tbl(user_id);
