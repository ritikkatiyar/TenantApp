-- V6__create_user_device_token.sql
-- Table structure for storing user device push tokens for Push Notifications (Expo)

CREATE TABLE `user_device_token_tbl` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `expo_push_token` VARCHAR(255) NOT NULL,
  `platform` VARCHAR(32) NOT NULL,
  `registered_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `last_seen_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_device_token_token` (`expo_push_token`),
  CONSTRAINT `fk_user_device_token_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
