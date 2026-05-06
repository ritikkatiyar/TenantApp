-- V5__seed_default_super_admin.sql
-- Seeds a default super admin user for first-time environments.
--
-- Default credentials:
--   email:    superadmin@tenantliving.com
--   password: Admin@123
--
-- Password hash generated with BCrypt (cost 10).

INSERT INTO user_tbl (
    id,
    auth_uid,
    full_name,
    phone_number,
    password_hash,
    failed_login_attempts,
    lockout_until
)
SELECT
    '51b21b41-22f7-44a6-ba3e-1e03421d46ea',
    'super@duper.com',
    'SuperDuperMan',
    '9658742346',
    '$2a$10$iF2sCXo.GR6uLLooK5FiHubhCvAY8xAr3mYmCIQDEgFuTvOK/PCzq',
    0,
    NULL
WHERE NOT EXISTS (
    SELECT 1
    FROM user_tbl
    WHERE auth_uid = 'super@duper.com'
);
