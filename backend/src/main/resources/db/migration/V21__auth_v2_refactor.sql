

-- Create new authorization tables
CREATE TABLE membership_role_tbl (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

CREATE TABLE permission_tbl (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

CREATE TABLE role_permission_tbl (
    id VARCHAR(36) PRIMARY KEY,
    role_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE(role_id, permission_id),
    CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id) REFERENCES membership_role_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permission_perm FOREIGN KEY (permission_id) REFERENCES permission_tbl(id) ON DELETE CASCADE
);

CREATE TABLE membership_tbl (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36),
    role_id VARCHAR(36) NOT NULL,
    assigned_by VARCHAR(36),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE(user_id, property_id, role_id),
    CONSTRAINT fk_membership_user FOREIGN KEY (user_id) REFERENCES user_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_membership_property FOREIGN KEY (property_id) REFERENCES property_tbl(id) ON DELETE CASCADE,
    CONSTRAINT fk_membership_role FOREIGN KEY (role_id) REFERENCES membership_role_tbl(id),
    CONSTRAINT fk_membership_assigned_by FOREIGN KEY (assigned_by) REFERENCES user_tbl(id)
);

-- Seed initial roles
INSERT INTO membership_role_tbl (id, code, name, description) VALUES
    (UUID(), 'PROPERTY_OWNER', 'Property Owner', 'Full access to property'),
    (UUID(), 'PROPERTY_MANAGER', 'Property Manager', 'Operational access to property'),
    (UUID(), 'PROPERTY_TENANT', 'Tenant', 'Limited access to own lease and property details');

-- Seed initial permissions
INSERT INTO permission_tbl (id, code, description) VALUES
    (UUID(), 'PROPERTY_VIEW', 'Can view property details'),
    (UUID(), 'PROPERTY_EDIT', 'Can edit property details'),
    (UUID(), 'PROPERTY_DELETE', 'Can delete property'),
    (UUID(), 'LEASE_CREATE', 'Can create leases'),
    (UUID(), 'LEASE_UPDATE', 'Can update leases'),
    (UUID(), 'LEASE_VIEW', 'Can view all leases'),
    (UUID(), 'LEASE_VIEW_OWN', 'Can view own lease'),
    (UUID(), 'EXPENSE_CREATE', 'Can create expenses'),
    (UUID(), 'EXPENSE_APPROVE', 'Can approve expenses'),
    (UUID(), 'PAYMENT_VIEW', 'Can view all payments'),
    (UUID(), 'PAYMENT_CREATE_OWN', 'Can create own payments'),
    (UUID(), 'ANNOUNCEMENT_CREATE', 'Can create announcements');

-- Map permissions to OWNER
INSERT INTO role_permission_tbl (id, role_id, permission_id)
SELECT UUID(), r.id, p.id
FROM membership_role_tbl r
JOIN permission_tbl p ON 1=1
WHERE r.code = 'PROPERTY_OWNER';

-- Map permissions to MANAGER
INSERT INTO role_permission_tbl (id, role_id, permission_id)
SELECT UUID(), r.id, p.id
FROM membership_role_tbl r
JOIN permission_tbl p ON 1=1
WHERE r.code = 'PROPERTY_MANAGER'
  AND p.code IN ('PROPERTY_VIEW', 'LEASE_CREATE', 'LEASE_UPDATE', 'LEASE_VIEW', 'EXPENSE_CREATE', 'PAYMENT_VIEW', 'ANNOUNCEMENT_CREATE');

-- Map permissions to TENANT
INSERT INTO role_permission_tbl (id, role_id, permission_id)
SELECT UUID(), r.id, p.id
FROM membership_role_tbl r
JOIN permission_tbl p ON 1=1
WHERE r.code = 'PROPERTY_TENANT'
  AND p.code IN ('PROPERTY_VIEW', 'LEASE_VIEW_OWN', 'PAYMENT_CREATE_OWN');
