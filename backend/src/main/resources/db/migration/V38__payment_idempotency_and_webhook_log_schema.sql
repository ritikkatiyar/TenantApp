-- V38__payment_idempotency_and_webhook_log_schema.sql

-- 1. Create webhook_event_log_tbl for strict idempotency deduplication
CREATE TABLE webhook_event_log_tbl (
    id VARCHAR(36) PRIMARY KEY,
    gateway_name VARCHAR(30) NOT NULL,
    gateway_event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PROCESSING', -- 'PROCESSING', 'PROCESSED', 'FAILED'
    payload LONGTEXT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_webhook_gateway_event (gateway_name, gateway_event_id),
    INDEX idx_webhook_status (status)
);

-- 2. Create failed_payment_event_tbl for dead-letter retry logging
CREATE TABLE failed_payment_event_tbl (
    id VARCHAR(36) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    payload_json LONGTEXT NOT NULL,
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_failed_event_type (event_type)
);
