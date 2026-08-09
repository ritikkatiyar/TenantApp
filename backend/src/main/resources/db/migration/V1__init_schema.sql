-- MySQL dump 10.13  Distrib 8.4.8, for Linux (x86_64)
--
-- Host: localhost    Database: livic
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_job_tbl`
--

DROP TABLE IF EXISTS `ai_job_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_job_tbl` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `prompt` text NOT NULL,
  `status` varchar(50) NOT NULL,
  `response` text,
  `error_message` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `retry_count` int NOT NULL DEFAULT '0',
  `user_token` text,
  PRIMARY KEY (`id`),
  KEY `idx_ai_job_user_id` (`user_id`),
  CONSTRAINT `fk_ai_job_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `announcement_receipt_tbl`
--

DROP TABLE IF EXISTS `announcement_receipt_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcement_receipt_tbl` (
  `id` varchar(36) NOT NULL,
  `announcement_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `read_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_announcement_user` (`announcement_id`,`user_id`),
  KEY `fk_receipt_user` (`user_id`),
  KEY `idx_receipt_announcement` (`announcement_id`),
  CONSTRAINT `fk_receipt_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `announcement_tbl` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_receipt_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `announcement_tbl`
--

DROP TABLE IF EXISTS `announcement_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcement_tbl` (
  `id` varchar(36) NOT NULL,
  `property_id` varchar(36) NOT NULL,
  `creator_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'GENERAL',
  `severity` varchar(50) NOT NULL DEFAULT 'INFO',
  `target_type` varchar(50) NOT NULL DEFAULT 'PROPERTY',
  `target_value` varchar(100) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_announcement_creator` (`creator_id`),
  KEY `idx_announcement_property` (`property_id`),
  CONSTRAINT `fk_announcement_creator` FOREIGN KEY (`creator_id`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_announcement_property` FOREIGN KEY (`property_id`) REFERENCES `property_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `billing_wallet_tbl`
--

DROP TABLE IF EXISTS `billing_wallet_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_wallet_tbl` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `credit_balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `last_topped_up` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_billing_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `billing_worksheet_entry_tbl`
--

DROP TABLE IF EXISTS `billing_worksheet_entry_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_worksheet_entry_tbl` (
  `id` varchar(36) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `property_id` varchar(36) NOT NULL,
  `unit_id` varchar(36) NOT NULL,
  `charge_config_id` varchar(36) NOT NULL,
  `is_billed` tinyint(1) NOT NULL DEFAULT '0',
  `entered_value` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_by` varchar(36) NOT NULL,
  `billing_month` char(7) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_billing_worksheet_entry` (`unit_id`,`charge_config_id`,`billing_month`),
  KEY `fk_meter_property` (`property_id`),
  KEY `fk_meter_charge_config` (`charge_config_id`),
  KEY `fk_meter_unit_idx` (`unit_id`),
  CONSTRAINT `fk_meter_charge_config` FOREIGN KEY (`charge_config_id`) REFERENCES `charge_config_tbl` (`id`),
  CONSTRAINT `fk_meter_property` FOREIGN KEY (`property_id`) REFERENCES `property_tbl` (`id`),
  CONSTRAINT `fk_meter_unit` FOREIGN KEY (`unit_id`) REFERENCES `unit_tbl` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `charge_config_tbl`
--

DROP TABLE IF EXISTS `charge_config_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `charge_config_tbl` (
  `id` varchar(36) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `property_id` varchar(36) NOT NULL,
  `charge_name` varchar(100) NOT NULL,
  `charge_category` varchar(50) NOT NULL,
  `billing_frequency` varchar(50) NOT NULL,
  `calculation_strategy` varchar(50) NOT NULL,
  `base_rate` decimal(10,2) DEFAULT NULL,
  `apply_sales_tax` tinyint(1) NOT NULL,
  `late_fee_percentage` decimal(5,2) DEFAULT NULL,
  `is_system_required` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `unit_type` varchar(50) DEFAULT NULL,
  `auto_carry_forward` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_charge_config_property` (`property_id`),
  CONSTRAINT `fk_charge_config_property` FOREIGN KEY (`property_id`) REFERENCES `property_tbl` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `failed_payment_event_tbl`
--

DROP TABLE IF EXISTS `failed_payment_event_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_payment_event_tbl` (
  `id` varchar(36) NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `payload_json` longtext NOT NULL,
  `error_message` text,
  `retry_count` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_failed_event_type` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `finance_ledger_tbl`
--

DROP TABLE IF EXISTS `finance_ledger_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `finance_ledger_tbl` (
  `id` varchar(36) NOT NULL,
  `unit_id` varchar(36) NOT NULL,
  `lease_id` varchar(36) DEFAULT NULL,
  `transaction_type` enum('INVOICE_GENERATED','PAYMENT_RECEIVED','LATE_FEE_APPLIED','REFUND','ADJUSTMENT') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `balance` decimal(10,2) NOT NULL,
  `reference_id` varchar(36) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_ledger_unit` (`unit_id`),
  KEY `fk_ledger_lease` (`lease_id`),
  CONSTRAINT `fk_ledger_lease` FOREIGN KEY (`lease_id`) REFERENCES `lease_tbl` (`id`),
  CONSTRAINT `fk_ledger_unit` FOREIGN KEY (`unit_id`) REFERENCES `unit_tbl` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `flyway_schema_history`
--

DROP TABLE IF EXISTS `flyway_schema_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `description` varchar(200) NOT NULL,
  `type` varchar(20) NOT NULL,
  `script` varchar(1000) NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lease_tbl`
--

DROP TABLE IF EXISTS `lease_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lease_tbl` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `unit_id` varchar(36) NOT NULL,
  `move_in_date` date NOT NULL,
  `move_out_date` date DEFAULT NULL,
  `status` enum('ACTIVE','ENDED') NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `security_deposit` decimal(10,2) NOT NULL DEFAULT '0.00',
  `split_strategy` enum('FULL_UNIT','PER_OCCUPANT','CUSTOM') NOT NULL DEFAULT 'FULL_UNIT',
  `monthly_rent_amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_lease_user_id` (`user_id`),
  KEY `idx_lease_unit_id` (`unit_id`),
  CONSTRAINT `fk_lease_unit` FOREIGN KEY (`unit_id`) REFERENCES `unit_tbl` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_lease_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `maintenance_ticket_tbl`
--

DROP TABLE IF EXISTS `maintenance_ticket_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_ticket_tbl` (
  `id` varchar(36) NOT NULL,
  `ticket_number` varchar(32) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `lease_id` varchar(36) NOT NULL,
  `property_id` varchar(36) NOT NULL,
  `unit_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(64) NOT NULL,
  `priority` varchar(32) NOT NULL DEFAULT 'STANDARD',
  `status` varchar(64) NOT NULL DEFAULT 'PENDING',
  `assigned_technician_name` varchar(128) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  KEY `fk_maint_ticket_unit` (`unit_id`),
  KEY `idx_maint_ticket_tenant` (`tenant_id`),
  KEY `idx_maint_ticket_property` (`property_id`),
  CONSTRAINT `fk_maint_ticket_property` FOREIGN KEY (`property_id`) REFERENCES `property_tbl` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_maint_ticket_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_maint_ticket_unit` FOREIGN KEY (`unit_id`) REFERENCES `unit_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `membership_role_tbl`
--

DROP TABLE IF EXISTS `membership_role_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membership_role_tbl` (
  `id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `property_id` varchar(36) DEFAULT NULL,
  `role_rank` int NOT NULL DEFAULT '30',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_code_property` (`code`,`property_id`),
  KEY `fk_membership_role_property` (`property_id`),
  CONSTRAINT `fk_membership_role_property` FOREIGN KEY (`property_id`) REFERENCES `property_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `membership_tbl`
--

DROP TABLE IF EXISTS `membership_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membership_tbl` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `property_id` varchar(36) DEFAULT NULL,
  `role_id` varchar(36) NOT NULL,
  `assigned_by` varchar(36) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`property_id`,`role_id`),
  KEY `fk_membership_property` (`property_id`),
  KEY `fk_membership_role` (`role_id`),
  KEY `fk_membership_assigned_by` (`assigned_by`),
  CONSTRAINT `fk_membership_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `user_tbl` (`id`),
  CONSTRAINT `fk_membership_property` FOREIGN KEY (`property_id`) REFERENCES `property_tbl` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_membership_role` FOREIGN KEY (`role_id`) REFERENCES `membership_role_tbl` (`id`),
  CONSTRAINT `fk_membership_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meter_reading_tbl`
--

DROP TABLE IF EXISTS `meter_reading_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meter_reading_tbl` (
  `id` varchar(36) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `property_id` varchar(36) NOT NULL,
  `unit_id` varchar(36) NOT NULL,
  `charge_config_id` varchar(36) NOT NULL,
  `billing_month` int NOT NULL,
  `billing_year` int NOT NULL,
  `previous_reading` decimal(10,2) NOT NULL DEFAULT '0.00',
  `current_reading` decimal(10,2) DEFAULT NULL,
  `is_billed` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_meter_reading` (`unit_id`,`charge_config_id`,`billing_month`,`billing_year`),
  KEY `fk_meter_rdg_prop_tbl_idx` (`property_id`),
  KEY `fk_meter_rdg_cc_tbl_idx` (`charge_config_id`),
  CONSTRAINT `fk_meter_rdg_cc_tbl_idx` FOREIGN KEY (`charge_config_id`) REFERENCES `charge_config_tbl` (`id`),
  CONSTRAINT `fk_meter_rdg_prop_tbl_idx` FOREIGN KEY (`property_id`) REFERENCES `property_tbl` (`id`),
  CONSTRAINT `fk_meter_rdg_unit_tbl_idx` FOREIGN KEY (`unit_id`) REFERENCES `unit_tbl` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_log_tbl`
--

DROP TABLE IF EXISTS `notification_log_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_log_tbl` (
  `id` varchar(36) NOT NULL,
  `recipient_id` varchar(36) NOT NULL,
  `channel` enum('EMAIL','WHATSAPP','PUSH','SMS') NOT NULL,
  `recipient_address` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `status` enum('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  `error_message` text,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_notification_recipient` (`recipient_id`),
  CONSTRAINT `fk_notification_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_transaction_tbl`
--

DROP TABLE IF EXISTS `payment_transaction_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_transaction_tbl` (
  `id` varchar(36) NOT NULL,
  `payer_user_id` varchar(36) NOT NULL,
  `payment_method` varchar(32) NOT NULL,
  `reference_type` varchar(32) NOT NULL,
  `reference_id` varchar(36) NOT NULL,
  `gateway_name` varchar(50) DEFAULT NULL,
  `gateway_transaction_id` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(32) NOT NULL,
  `webhook_payload` json DEFAULT NULL,
  `confirmed_by` varchar(36) DEFAULT NULL,
  `confirmed_at` datetime(6) DEFAULT NULL,
  `note` text,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `gateway_transaction_id` (`gateway_transaction_id`),
  KEY `fk_payment_tx_confirmed` (`confirmed_by`),
  KEY `idx_payment_tx_payer` (`payer_user_id`),
  KEY `idx_payment_tx_reference` (`reference_type`,`reference_id`),
  CONSTRAINT `fk_payment_tx_confirmed` FOREIGN KEY (`confirmed_by`) REFERENCES `user_tbl` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payment_tx_payer` FOREIGN KEY (`payer_user_id`) REFERENCES `user_tbl` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_webhook_event_tbl`
--

DROP TABLE IF EXISTS `payment_webhook_event_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_webhook_event_tbl` (
  `id` varchar(36) NOT NULL,
  `gateway_name` varchar(50) NOT NULL,
  `gateway_event_id` varchar(255) NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `payload` json NOT NULL,
  `processed_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `gateway_event_id` (`gateway_event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permission_tbl`
--

DROP TABLE IF EXISTS `permission_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_tbl` (
  `id` varchar(36) NOT NULL,
  `code` varchar(100) NOT NULL,
  `description` text,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plan_feature_limit_tbl`
--

DROP TABLE IF EXISTS `plan_feature_limit_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plan_feature_limit_tbl` (
  `id` varchar(36) NOT NULL,
  `plan_id` varchar(36) NOT NULL,
  `feature_key` varchar(100) NOT NULL,
  `limit_value` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plan_feature` (`plan_id`,`feature_key`),
  KEY `idx_plan_feature_key` (`feature_key`),
  CONSTRAINT `fk_plan_feature_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plan_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `property_join_code_tbl`
--

DROP TABLE IF EXISTS `property_join_code_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_join_code_tbl` (
  `id` varchar(36) NOT NULL,
  `property_id` varchar(36) NOT NULL,
  `role_id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `created_by` varchar(36) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `max_uses` int NOT NULL DEFAULT '1',
  `uses_count` int NOT NULL DEFAULT '0',
  `expires_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `fk_join_code_property` (`property_id`),
  KEY `fk_join_code_role` (`role_id`),
  KEY `fk_join_code_created_by` (`created_by`),
  KEY `idx_join_code_lookup` (`code`),
  CONSTRAINT `fk_join_code_created_by` FOREIGN KEY (`created_by`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_join_code_property` FOREIGN KEY (`property_id`) REFERENCES `property_tbl` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_join_code_role` FOREIGN KEY (`role_id`) REFERENCES `membership_role_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `property_module_tbl`
--

DROP TABLE IF EXISTS `property_module_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_module_tbl` (
  `id` varchar(36) NOT NULL,
  `property_id` varchar(36) NOT NULL,
  `module_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `property_id` (`property_id`,`module_name`),
  CONSTRAINT `fk_property_module_prop` FOREIGN KEY (`property_id`) REFERENCES `property_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `property_tbl`
--

DROP TABLE IF EXISTS `property_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_tbl` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `total_floors` int DEFAULT NULL,
  `auto_bill_day_of_month` int DEFAULT NULL,
  `auto_bill_time` time DEFAULT NULL,
  `property_type` varchar(50) NOT NULL DEFAULT 'RENTAL',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `allow_partial_payment` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `refreshtoken_tbl`
--

DROP TABLE IF EXISTS `refreshtoken_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refreshtoken_tbl` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `revoked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_refreshtoken_user_id` (`user_id`),
  CONSTRAINT `fk_refreshtoken_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rent_cycle_charge_tbl`
--

DROP TABLE IF EXISTS `rent_cycle_charge_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rent_cycle_charge_tbl` (
  `id` varchar(36) NOT NULL,
  `rent_cycle_id` varchar(36) NOT NULL,
  `charge_type` enum('BASE_RENT','ELECTRICITY','FOOD','MAINTENANCE','PENALTY','DISCOUNT','CUSTOM') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `charge_config_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rent_cycle_charge_cycle_id` (`rent_cycle_id`),
  KEY `fk_rent_cycle_charge_config` (`charge_config_id`),
  CONSTRAINT `fk_rent_cycle_charge_config` FOREIGN KEY (`charge_config_id`) REFERENCES `charge_config_tbl` (`id`),
  CONSTRAINT `fk_rent_cycle_charge_cycle` FOREIGN KEY (`rent_cycle_id`) REFERENCES `rent_cycle_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rent_cycle_tbl`
--

DROP TABLE IF EXISTS `rent_cycle_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rent_cycle_tbl` (
  `id` varchar(36) NOT NULL,
  `lease_id` varchar(36) NOT NULL,
  `billing_month` char(7) NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('PENDING','PAID','OVERDUE','PUBLISHED','PARTIALLY_PAID') NOT NULL,
  `paid_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `amount_paid` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_transaction_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rent_cycle_lease_billing_month` (`lease_id`,`billing_month`),
  KEY `idx_rent_cycle_lease_id` (`lease_id`),
  KEY `idx_rent_cycle_month` (`billing_month`),
  KEY `idx_rent_cycle_billing_month` (`billing_month`),
  KEY `fk_rent_cycle_payment_tx` (`payment_transaction_id`),
  CONSTRAINT `fk_rent_cycle_lease` FOREIGN KEY (`lease_id`) REFERENCES `lease_tbl` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rent_cycle_payment_tx` FOREIGN KEY (`payment_transaction_id`) REFERENCES `payment_transaction_tbl` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role_permission_tbl`
--

DROP TABLE IF EXISTS `role_permission_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permission_tbl` (
  `id` varchar(36) NOT NULL,
  `role_id` varchar(36) NOT NULL,
  `permission_id` varchar(36) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_id` (`role_id`,`permission_id`),
  KEY `fk_role_permission_perm` (`permission_id`),
  CONSTRAINT `fk_role_permission_perm` FOREIGN KEY (`permission_id`) REFERENCES `permission_tbl` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `membership_role_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `saas_subscription_tbl`
--

DROP TABLE IF EXISTS `saas_subscription_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_subscription_tbl` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `plan_id` varchar(36) DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `billing_cycle` varchar(20) NOT NULL DEFAULT 'MONTHLY',
  `current_period_start` datetime(6) NOT NULL,
  `current_period_end` datetime(6) NOT NULL,
  `auto_renew` tinyint(1) NOT NULL DEFAULT '1',
  `gateway_type` varchar(30) NOT NULL DEFAULT 'RAZORPAY',
  `gateway_subscription_id` varchar(255) DEFAULT NULL,
  `gateway_customer_id` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_saas_sub_user` (`user_id`),
  KEY `idx_saas_sub_plan` (`plan_id`),
  CONSTRAINT `fk_saas_sub_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plan_tbl` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_saas_sub_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subscription_plan_tbl`
--

DROP TABLE IF EXISTS `subscription_plan_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_plan_tbl` (
  `id` varchar(36) NOT NULL,
  `plan_key` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price_monthly` decimal(10,2) NOT NULL DEFAULT '0.00',
  `price_yearly` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `gateway_plan_id_monthly` varchar(255) DEFAULT NULL,
  `gateway_plan_id_yearly` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `plan_key` (`plan_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unit_booking_tbl`
--

DROP TABLE IF EXISTS `unit_booking_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unit_booking_tbl` (
  `id` varchar(36) NOT NULL,
  `unit_id` varchar(36) NOT NULL,
  `prospective_tenant_user_id` varchar(36) DEFAULT NULL,
  `prospective_tenant_name` varchar(255) NOT NULL,
  `prospective_tenant_phone` varchar(32) NOT NULL,
  `prospective_tenant_email` varchar(255) DEFAULT NULL,
  `token_amount` decimal(10,2) NOT NULL,
  `expected_move_in_date` date NOT NULL,
  `status` varchar(32) NOT NULL,
  `payment_transaction_id` varchar(36) DEFAULT NULL,
  `converted_lease_id` varchar(36) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_unit_booking_payment` (`payment_transaction_id`),
  KEY `fk_unit_booking_lease` (`converted_lease_id`),
  KEY `idx_unit_booking_unit` (`unit_id`),
  KEY `idx_unit_booking_user` (`prospective_tenant_user_id`),
  CONSTRAINT `fk_unit_booking_lease` FOREIGN KEY (`converted_lease_id`) REFERENCES `lease_tbl` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_unit_booking_payment` FOREIGN KEY (`payment_transaction_id`) REFERENCES `payment_transaction_tbl` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_unit_booking_unit` FOREIGN KEY (`unit_id`) REFERENCES `unit_tbl` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_unit_booking_user` FOREIGN KEY (`prospective_tenant_user_id`) REFERENCES `user_tbl` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unit_tbl`
--

DROP TABLE IF EXISTS `unit_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unit_tbl` (
  `id` varchar(36) NOT NULL,
  `property_id` varchar(36) NOT NULL,
  `unit_number` varchar(100) NOT NULL,
  `floor` int NOT NULL,
  `type` enum('SINGLE_UNIT','SHARED_UNIT','ONE_BHK','TWO_BHK','STUDIO') NOT NULL,
  `capacity` int NOT NULL,
  `facing` varchar(50) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `grid_x` int NOT NULL DEFAULT '0',
  `grid_y` int NOT NULL DEFAULT '0',
  `grid_width` int NOT NULL DEFAULT '1',
  `grid_height` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_unit_tbl_property_unit_number` (`property_id`,`unit_number`),
  KEY `idx_unit_property_id` (`property_id`),
  CONSTRAINT `fk_unit_property` FOREIGN KEY (`property_id`) REFERENCES `property_tbl` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_preference_tbl`
--

DROP TABLE IF EXISTS `user_preference_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preference_tbl` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `active_mode` enum('RENTAL','HOSTEL','MESS','SOCIETY','INDIVIDUAL') NOT NULL DEFAULT 'RENTAL',
  `onboarding_done` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_onboarding_preference_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_tbl`
--

DROP TABLE IF EXISTS `user_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_tbl` (
  `id` varchar(36) NOT NULL,
  `auth_uid` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone_number` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `failed_login_attempts` int NOT NULL DEFAULT '0',
  `lockout_until` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `global_role` enum('USER','SUPER_ADMIN','ADMIN') NOT NULL DEFAULT 'USER',
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_uid` (`auth_uid`),
  UNIQUE KEY `phone_number` (`phone_number`),
  UNIQUE KEY `uk_user_tbl_phone_number` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wallet_transaction_tbl`
--

DROP TABLE IF EXISTS `wallet_transaction_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_transaction_tbl` (
  `id` varchar(36) NOT NULL,
  `wallet_id` varchar(36) NOT NULL,
  `amount` decimal(10,4) NOT NULL,
  `transaction_type` enum('CREDIT','DEBIT') NOT NULL,
  `reason` varchar(100) NOT NULL,
  `reference_id` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_wallet_tx_wallet` (`wallet_id`),
  CONSTRAINT `fk_wallet_tx_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `billing_wallet_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `webhook_event_log_tbl`
--

DROP TABLE IF EXISTS `webhook_event_log_tbl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhook_event_log_tbl` (
  `id` varchar(36) NOT NULL,
  `gateway_name` varchar(30) NOT NULL,
  `gateway_event_id` varchar(255) NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'PROCESSING',
  `payload` longtext NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `gateway_event_id` (`gateway_event_id`),
  KEY `idx_webhook_gateway_event` (`gateway_name`,`gateway_event_id`),
  KEY `idx_webhook_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-09  4:19:27
