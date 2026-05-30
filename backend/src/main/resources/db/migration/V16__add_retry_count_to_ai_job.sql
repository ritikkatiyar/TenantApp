-- V16__add_retry_count_to_ai_job.sql
-- Add retry_count column for AI job retry tracking

ALTER TABLE ai_job_tbl ADD COLUMN retry_count INT NOT NULL DEFAULT 0;
