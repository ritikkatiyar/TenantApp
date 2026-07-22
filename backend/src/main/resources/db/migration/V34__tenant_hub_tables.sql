-- Migration File: V34__tenant_hub_tables.sql

CREATE TABLE maintenance_ticket_tbl (
    id VARCHAR(36) PRIMARY KEY,
    ticket_number VARCHAR(32) NOT NULL UNIQUE,
    tenant_id VARCHAR(36) NOT NULL,
    lease_id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    unit_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'STANDARD',
    status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
    assigned_technician_name VARCHAR(128),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_maint_ticket_tenant FOREIGN KEY (tenant_id) REFERENCES user_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_maint_ticket_property FOREIGN KEY (property_id) REFERENCES property_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_maint_ticket_unit FOREIGN KEY (unit_id) REFERENCES unit_tbl(id) ON DELETE CASCADE
);

CREATE INDEX idx_maint_ticket_tenant ON maintenance_ticket_tbl(tenant_id);
CREATE INDEX idx_maint_ticket_property ON maintenance_ticket_tbl(property_id);
