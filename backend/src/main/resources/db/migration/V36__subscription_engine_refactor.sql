-- V36__subscription_engine_refactor.sql

-- 1. Create subscription_plan_tbl
CREATE TABLE subscription_plan_tbl (
    id VARCHAR(36) PRIMARY KEY,
    plan_key VARCHAR(50) NOT NULL UNIQUE, -- 'STARTER', 'BASIC', 'PREMIUM', 'ENTERPRISE'
    name VARCHAR(100) NOT NULL,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    gateway_plan_id_monthly VARCHAR(255),
    gateway_plan_id_yearly VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

-- 2. Create plan_feature_limit_tbl
CREATE TABLE plan_feature_limit_tbl (
    id VARCHAR(36) PRIMARY KEY,
    plan_id VARCHAR(36) NOT NULL,
    feature_key VARCHAR(100) NOT NULL,
    limit_value INT NOT NULL DEFAULT 0, -- -1 = unlimited, 0 = disabled / limit 0, 1 = enabled / limit 1, N = count limit
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_plan_feature_plan FOREIGN KEY (plan_id) REFERENCES subscription_plan_tbl(id) ON DELETE CASCADE,
    CONSTRAINT uk_plan_feature UNIQUE (plan_id, feature_key)
);

-- 3. Seed Subscription Plans with dynamic UUID()
INSERT INTO subscription_plan_tbl (id, plan_key, name, price_monthly, price_yearly, currency, is_active) VALUES
(UUID(), 'STARTER', 'Starter (Free)', 0.00, 0.00, 'INR', TRUE),
(UUID(), 'BASIC', 'Basic Landlord', 799.00, 7670.00, 'INR', TRUE),
(UUID(), 'PREMIUM', 'Premium Portfolio', 1599.00, 15350.00, 'INR', TRUE),
(UUID(), 'ENTERPRISE', 'Enterprise Unlimited', 3999.00, 38390.00, 'INR', TRUE);

-- 4. Seed Plan Feature Limits (dynamically linking via plan_key subqueries)

-- ── STARTER PLAN ──
INSERT INTO plan_feature_limit_tbl (id, plan_id, feature_key, limit_value)
SELECT UUID(), id, 'MAX_PROPERTIES', 1 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'MAX_UNITS', 5 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'MAX_TEAM_MEMBERS', 1 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'AI_CREDITS_MONTHLY', 50 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'COMMAND_CENTER_3D', 0 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'CUSTOM_CHARGE_TYPES', 0 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'BATCH_RENT_GENERATION', 0 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'BILLING_WORKSHEET', 0 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'FINANCIAL_LEDGER', 0 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'PREMIUM_EXPENSE_SPLIT', 0 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'INVOICE_PDF', 0 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'CUSTOM_ROLES', 0 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'FINE_GRAINED_PERMISSIONS', 0 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'TARGETED_ANNOUNCEMENTS', 0 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'ADVANCED_ANALYTICS', 0 FROM subscription_plan_tbl WHERE plan_key = 'STARTER'
UNION ALL SELECT UUID(), id, 'ADVANCED_REPORTS', 0 FROM subscription_plan_tbl WHERE plan_key = 'STARTER';

-- ── BASIC PLAN ──
INSERT INTO plan_feature_limit_tbl (id, plan_id, feature_key, limit_value)
SELECT UUID(), id, 'MAX_PROPERTIES', 3 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'MAX_UNITS', 25 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'MAX_TEAM_MEMBERS', 3 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'AI_CREDITS_MONTHLY', 200 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'COMMAND_CENTER_3D', 0 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'CUSTOM_CHARGE_TYPES', 1 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'BATCH_RENT_GENERATION', 1 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'BILLING_WORKSHEET', 0 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'FINANCIAL_LEDGER', 0 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'PREMIUM_EXPENSE_SPLIT', 0 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'INVOICE_PDF', 1 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'CUSTOM_ROLES', 0 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'FINE_GRAINED_PERMISSIONS', 0 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'TARGETED_ANNOUNCEMENTS', 1 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'ADVANCED_ANALYTICS', 0 FROM subscription_plan_tbl WHERE plan_key = 'BASIC'
UNION ALL SELECT UUID(), id, 'ADVANCED_REPORTS', 0 FROM subscription_plan_tbl WHERE plan_key = 'BASIC';

-- ── PREMIUM PLAN ──
INSERT INTO plan_feature_limit_tbl (id, plan_id, feature_key, limit_value)
SELECT UUID(), id, 'MAX_PROPERTIES', 10 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'MAX_UNITS', 100 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'MAX_TEAM_MEMBERS', 10 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'AI_CREDITS_MONTHLY', 1000 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'COMMAND_CENTER_3D', 1 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'CUSTOM_CHARGE_TYPES', 1 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'BATCH_RENT_GENERATION', 1 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'BILLING_WORKSHEET', 1 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'FINANCIAL_LEDGER', 1 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'PREMIUM_EXPENSE_SPLIT', 1 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'INVOICE_PDF', 1 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'CUSTOM_ROLES', 1 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'FINE_GRAINED_PERMISSIONS', 1 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'TARGETED_ANNOUNCEMENTS', 1 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'ADVANCED_ANALYTICS', 1 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM'
UNION ALL SELECT UUID(), id, 'ADVANCED_REPORTS', 1 FROM subscription_plan_tbl WHERE plan_key = 'PREMIUM';

-- ── ENTERPRISE PLAN ──
INSERT INTO plan_feature_limit_tbl (id, plan_id, feature_key, limit_value)
SELECT UUID(), id, 'MAX_PROPERTIES', -1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'MAX_UNITS', -1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'MAX_TEAM_MEMBERS', -1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'AI_CREDITS_MONTHLY', -1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'COMMAND_CENTER_3D', 1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'CUSTOM_CHARGE_TYPES', 1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'BATCH_RENT_GENERATION', 1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'BILLING_WORKSHEET', 1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'FINANCIAL_LEDGER', 1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'PREMIUM_EXPENSE_SPLIT', 1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'INVOICE_PDF', 1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'CUSTOM_ROLES', 1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'FINE_GRAINED_PERMISSIONS', 1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'TARGETED_ANNOUNCEMENTS', 1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'ADVANCED_ANALYTICS', 1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE'
UNION ALL SELECT UUID(), id, 'ADVANCED_REPORTS', 1 FROM subscription_plan_tbl WHERE plan_key = 'ENTERPRISE';

-- 5. Refactor saas_subscription_tbl
ALTER TABLE saas_subscription_tbl
    ADD COLUMN plan_id VARCHAR(36) NULL AFTER user_id,
    ADD COLUMN billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY' AFTER status,
    ADD COLUMN gateway_type VARCHAR(30) NOT NULL DEFAULT 'RAZORPAY' AFTER auto_renew,
    ADD COLUMN gateway_customer_id VARCHAR(255) NULL AFTER gateway_subscription_id,
    DROP COLUMN plan_name,
    DROP COLUMN price,
    ADD CONSTRAINT fk_saas_sub_plan FOREIGN KEY (plan_id) REFERENCES subscription_plan_tbl(id) ON DELETE RESTRICT;

-- Update existing active subscriptions to point to STARTER plan if plan_id is null
UPDATE saas_subscription_tbl SET plan_id = (SELECT id FROM subscription_plan_tbl WHERE plan_key = 'STARTER' LIMIT 1) WHERE plan_id IS NULL;

-- 6. Add index for fast query performance
CREATE INDEX idx_plan_feature_key ON plan_feature_limit_tbl(feature_key);
CREATE INDEX idx_saas_sub_plan ON saas_subscription_tbl(plan_id);
