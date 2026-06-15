-- V6__add_user_global_role.sql
-- Application-wide role for Spring Security.

ALTER TABLE user_tbl
    ADD COLUMN global_role ENUM('USER', 'SUPER_ADMIN', 'ADMIN') NOT NULL DEFAULT 'USER';

UPDATE user_tbl
SET global_role = 'SUPER_ADMIN'
WHERE auth_uid = 'super@duper.com';
