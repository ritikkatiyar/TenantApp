-- V1__init_schema.sql
-- Tenant Living / Property Management schema

CREATE TABLE user_tbl (
    id VARCHAR(36) PRIMARY KEY,
    auth_uid VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    phone_number VARCHAR(50),
    password_hash VARCHAR(255),
    role VARCHAR(50),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

CREATE TABLE property_tbl (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    landmark VARCHAR(255),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_property_owner FOREIGN KEY (owner_id) REFERENCES user_tbl(id) ON DELETE SET NULL
);

CREATE TABLE user_property_role_tbl (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    role ENUM('OWNER', 'MANAGER', 'TENANT') NOT NULL,
    assigned_by VARCHAR(36),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_user_property_role_user FOREIGN KEY (user_id) REFERENCES user_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_property_role_property FOREIGN KEY (property_id) REFERENCES property_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_property_role_assigned_by FOREIGN KEY (assigned_by) REFERENCES user_tbl(id) ON DELETE SET NULL
);

CREATE TABLE unit_tbl (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    unit_number VARCHAR(100) NOT NULL,
    floor INT NOT NULL,
    type ENUM('SINGLE_UNIT', 'SHARED_UNIT', 'ONE_BHK', 'TWO_BHK', 'STUDIO') NOT NULL,
    capacity INT NOT NULL,
    facing VARCHAR(50),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_unit_property FOREIGN KEY (property_id) REFERENCES property_tbl(id) ON DELETE RESTRICT
);

CREATE TABLE lease_tbl (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    unit_id VARCHAR(36) NOT NULL,
    rent_amount DECIMAL(10, 2) NOT NULL,
    move_in_date DATE NOT NULL,
    move_out_date DATE,
    status ENUM('ACTIVE', 'ENDED') NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_lease_user FOREIGN KEY (user_id) REFERENCES user_tbl(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lease_unit FOREIGN KEY (unit_id) REFERENCES unit_tbl(id) ON DELETE RESTRICT
);

CREATE TABLE rent_cycle_tbl (
    id VARCHAR(36) PRIMARY KEY,
    lease_id VARCHAR(36) NOT NULL,
    month CHAR(7) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL,
    paid_at DATETIME(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_rent_cycle_lease FOREIGN KEY (lease_id) REFERENCES lease_tbl(id) ON DELETE CASCADE
);

CREATE TABLE refreshtoken_tbl (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME(6) NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_refreshtoken_user FOREIGN KEY (user_id) REFERENCES user_tbl(id) ON DELETE CASCADE
);

CREATE INDEX idx_property_owner_id ON property_tbl(owner_id);
CREATE INDEX idx_user_property_role_user_id ON user_property_role_tbl(user_id);
CREATE INDEX idx_user_property_role_property_id ON user_property_role_tbl(property_id);
CREATE INDEX idx_user_property_role_assigned_by ON user_property_role_tbl(assigned_by);
CREATE INDEX idx_unit_property_id ON unit_tbl(property_id);
CREATE INDEX idx_lease_user_id ON lease_tbl(user_id);
CREATE INDEX idx_lease_unit_id ON lease_tbl(unit_id);
CREATE INDEX idx_rent_cycle_lease_id ON rent_cycle_tbl(lease_id);
CREATE INDEX idx_rent_cycle_month ON rent_cycle_tbl(month);
CREATE INDEX idx_refreshtoken_user_id ON refreshtoken_tbl(user_id);
