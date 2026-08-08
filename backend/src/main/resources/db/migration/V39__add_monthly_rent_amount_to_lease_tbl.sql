-- V39__add_monthly_rent_amount_to_lease_tbl.sql

-- Add monthly_rent_amount column directly to lease_tbl
ALTER TABLE lease_tbl ADD COLUMN monthly_rent_amount DECIMAL(10, 2) NOT NULL;
