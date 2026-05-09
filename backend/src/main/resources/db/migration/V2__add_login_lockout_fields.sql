-- V2__add_login_lockout_fields.sql
-- Adds fields for failed login tracking and account lockout when upgrading older schemas.

SET @add_failed_login_attempts = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE user_tbl ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_tbl'
      AND column_name = 'failed_login_attempts'
);

PREPARE add_failed_login_attempts_statement FROM @add_failed_login_attempts;
EXECUTE add_failed_login_attempts_statement;
DEALLOCATE PREPARE add_failed_login_attempts_statement;

SET @add_lockout_until = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE user_tbl ADD COLUMN lockout_until DATETIME(6)',
        'SELECT 1'
    )
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_tbl'
      AND column_name = 'lockout_until'
);

PREPARE add_lockout_until_statement FROM @add_lockout_until;
EXECUTE add_lockout_until_statement;
DEALLOCATE PREPARE add_lockout_until_statement;
