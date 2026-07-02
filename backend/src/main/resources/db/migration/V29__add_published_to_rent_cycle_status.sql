-- V29__add_published_to_rent_cycle_status.sql
ALTER TABLE rent_cycle_tbl MODIFY COLUMN status ENUM('PENDING', 'PAID', 'OVERDUE', 'PUBLISHED') NOT NULL;
