-- Migration File: V20__create_announcement_schema.sql

-- ==========================================
-- 2. ANNOUNCEMENT & BROADCAST TABLES
-- ==========================================

CREATE TABLE announcement_tbl (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    creator_id VARCHAR(36) NOT NULL, -- Owner, Manager, or Caretaker user ID
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL', -- GENERAL, MAINTENANCE, EMERGENCY, BILLING, EVENT
    severity VARCHAR(50) NOT NULL DEFAULT 'INFO', -- INFO, WARNING, CRITICAL
    target_type VARCHAR(50) NOT NULL DEFAULT 'PROPERTY', -- PROPERTY, FLOOR, UNIT
    target_value VARCHAR(100), -- Floor number (e.g., '3') or unit_id depending on target_type
    metadata JSON, -- Custom configs (e.g., links, RSVP parameters)
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_announcement_property FOREIGN KEY (property_id) REFERENCES property_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_announcement_creator FOREIGN KEY (creator_id) REFERENCES user_tbl(id) ON DELETE CASCADE
);

CREATE TABLE announcement_receipt_tbl (
    id VARCHAR(36) PRIMARY KEY,
    announcement_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL, -- Tenant user ID
    read_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_receipt_announcement FOREIGN KEY (announcement_id) REFERENCES announcement_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_receipt_user FOREIGN KEY (user_id) REFERENCES user_tbl(id) ON DELETE CASCADE,
    UNIQUE KEY uq_announcement_user (announcement_id, user_id)
);

CREATE INDEX idx_announcement_property ON announcement_tbl(property_id);
CREATE INDEX idx_receipt_announcement ON announcement_receipt_tbl(announcement_id);
