-- V10__create_ai_job_table.sql
-- Schema tracking for asynchronous AI Operations Assistant tasks

CREATE TABLE ai_job_tbl (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    prompt TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    response TEXT,
    error_message VARCHAR(255),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_ai_job_user FOREIGN KEY (user_id) REFERENCES user_tbl(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_job_user_id ON ai_job_tbl(user_id);
