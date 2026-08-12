CREATE TABLE `issue_tbl` (
  `id` varchar(36) NOT NULL,
  `property_id` varchar(36) NOT NULL,
  `unit_id` varchar(36) DEFAULT NULL,
  `lease_id` varchar(36) DEFAULT NULL,
  `tenant_id` varchar(36) DEFAULT NULL,
  `reported_by_user_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(64) NOT NULL,
  `priority` varchar(32) NOT NULL,
  `status` varchar(64) NOT NULL,
  `scope` varchar(32) NOT NULL,
  `escalation_status` varchar(32) NOT NULL,
  `escalation_level` int NOT NULL DEFAULT 0,
  `assigned_contact_name` varchar(128) NOT NULL,
  `assigned_contact_phone` varchar(32) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_issue_property` (`property_id`),
  KEY `idx_issue_tenant` (`tenant_id`),
  CONSTRAINT `fk_issue_property` FOREIGN KEY (`property_id`) REFERENCES `property_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `issue_timeline_tbl` (
  `id` varchar(36) NOT NULL,
  `issue_id` varchar(36) NOT NULL,
  `author_user_id` varchar(36) NOT NULL,
  `entry_type` varchar(64) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_timeline_issue` (`issue_id`),
  CONSTRAINT `fk_timeline_issue` FOREIGN KEY (`issue_id`) REFERENCES `issue_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
