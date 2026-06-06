-- V18__create_notification_schema.sql
-- Creates the table for logging and auditing dispatched notifications

CREATE TABLE notification_log_tbl (
    id VARCHAR(36) PRIMARY KEY,
    recipient_id VARCHAR(36) NOT NULL, -- Target user ID from user_tbl
    channel ENUM('EMAIL', 'WHATSAPP', 'PUSH', 'SMS') NOT NULL,
    recipient_address VARCHAR(255) NOT NULL, -- Email address or phone number
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id) REFERENCES user_tbl(id) ON DELETE CASCADE
);

CREATE INDEX idx_notification_recipient ON notification_log_tbl(recipient_id);
