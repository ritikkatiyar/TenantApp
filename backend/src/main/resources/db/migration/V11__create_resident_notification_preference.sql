-- V11__create_resident_notification_preference.sql
-- Dedicated notification delivery preferences for residents/tenants

CREATE TABLE `resident_notification_preference_tbl` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `email_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `push_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `whatsapp_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_resident_notif_pref_user` (`user_id`),
  CONSTRAINT `fk_resident_notif_pref_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
