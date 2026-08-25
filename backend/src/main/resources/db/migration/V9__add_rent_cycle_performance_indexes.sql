-- Migration V9: Add performance indexes for Rent Cycle lookups and paginated filtering
CREATE INDEX `idx_rent_cycle_month_status_due` ON `rent_cycle_tbl` (`billing_month`, `status`, `due_date`);
CREATE INDEX `idx_rent_cycle_lease_month` ON `rent_cycle_tbl` (`lease_id`, `billing_month`);
