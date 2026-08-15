-- ====================================================================
-- Flyway Migration V8: Storage & Media Asset + Inventory Schema
-- ====================================================================

-- 1. Media Asset Table (Pluggable Storage)
CREATE TABLE IF NOT EXISTS media_asset_tbl (
    id CHAR(36) NOT NULL,
    owner_module VARCHAR(32) NOT NULL,
    reference_id CHAR(36) NOT NULL,
    storage_provider VARCHAR(32) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    file_type VARCHAR(32) NOT NULL,
    caption VARCHAR(255) NULL,
    uploaded_by_user_id CHAR(36) NOT NULL,
    uploaded_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_media_asset PRIMARY KEY (id),
    INDEX idx_media_asset_owner_ref (owner_module, reference_id),
    INDEX idx_media_asset_uploaded_by (uploaded_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Inventory Item Table
CREATE TABLE IF NOT EXISTS inventory_item_tbl (
    id CHAR(36) NOT NULL,
    property_id CHAR(36) NOT NULL,
    unit_id CHAR(36) NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    serial_number VARCHAR(128) NULL,
    model_number VARCHAR(128) NULL,
    scope VARCHAR(32) NOT NULL,
    current_condition VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    purchase_date DATE NULL,
    warranty_expires_at DATE NULL,
    next_service_date DATE NULL,
    replacement_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_inventory_item PRIMARY KEY (id),
    INDEX idx_inv_item_property (property_id),
    INDEX idx_inv_item_unit (unit_id),
    INDEX idx_inv_item_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Lease Inventory Assignment Table
CREATE TABLE IF NOT EXISTS lease_inventory_assignment_tbl (
    id CHAR(36) NOT NULL,
    lease_id CHAR(36) NOT NULL,
    item_id CHAR(36) NOT NULL,
    condition_at_assignment VARCHAR(32) NOT NULL,
    assigned_at DATETIME(6) NOT NULL,
    assignment_notes TEXT NULL,
    condition_at_return VARCHAR(32) NULL,
    returned_at DATETIME(6) NULL,
    return_notes TEXT NULL,
    damage_deduction_amount DECIMAL(12,2) NULL,
    deduction_approval_status VARCHAR(32) NOT NULL DEFAULT 'NONE',
    verified_by CHAR(36) NULL,
    settled_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_lease_inv_assignment PRIMARY KEY (id),
    INDEX idx_lease_inv_assign_lease (lease_id),
    INDEX idx_lease_inv_assign_item (item_id),
    INDEX idx_lease_inv_assign_returned (item_id, returned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Inventory Service Expense Table
CREATE TABLE IF NOT EXISTS inventory_service_expense_tbl (
    id CHAR(36) NOT NULL,
    item_id CHAR(36) NOT NULL,
    property_id CHAR(36) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    service_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    next_service_date DATE NULL,
    recorded_by CHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_inv_service_expense PRIMARY KEY (id),
    INDEX idx_inv_service_item (item_id),
    INDEX idx_inv_service_property (property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
