-- V19__add_updated_at_to_notification_log.sql
-- Adds the missing updated_at column to notification_log_tbl to align with BaseEntity

ALTER TABLE notification_log_tbl
ADD COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6);
