ALTER TABLE `announcement_tbl` DROP COLUMN `target_value`;
ALTER TABLE `announcement_tbl` ADD COLUMN `target_floor_number` int DEFAULT NULL;
ALTER TABLE `announcement_tbl` ADD COLUMN `target_unit_id` varchar(36) DEFAULT NULL;
