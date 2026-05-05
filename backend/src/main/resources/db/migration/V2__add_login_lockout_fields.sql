-- V2__add_login_lockout_fields.sql
-- Adds fields for failed login tracking and account lockout.

ALTER TABLE user_tbl
    ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN lockout_until DATETIME(6);
