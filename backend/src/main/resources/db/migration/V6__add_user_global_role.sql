-- V6__add_user_global_role.sql
-- Application-wide role for Spring Security (distinct from per-property user_property_role_tbl).

ALTER TABLE user_tbl
    ADD COLUMN global_role ENUM('USER', 'SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF') NOT NULL DEFAULT 'USER';

UPDATE user_tbl
SET global_role = 'SUPER_ADMIN'
WHERE auth_uid = 'super@duper.com';
