-- 1. Add property_type to property_tbl
ALTER TABLE property_tbl
ADD COLUMN property_type VARCHAR(50) NOT NULL DEFAULT 'RENTAL';

-- 2. Migrate existing owner_id to membership_tbl if missing
INSERT INTO membership_tbl (id, user_id, property_id, role_id, created_at, updated_at)
SELECT UUID(), p.owner_id, p.id, r.id, NOW(), NOW()
FROM property_tbl p
JOIN membership_role_tbl r ON r.code = 'PROPERTY_OWNER'
WHERE p.owner_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM membership_tbl m 
      WHERE m.user_id = p.owner_id 
        AND m.property_id = p.id 
        AND m.role_id = r.id
  );

-- 3. Drop owner_id constraint and column
ALTER TABLE property_tbl DROP FOREIGN KEY fk_property_owner;
ALTER TABLE property_tbl DROP COLUMN owner_id;

-- 4. Create property_module_tbl
CREATE TABLE property_module_tbl (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE(property_id, module_name),
    CONSTRAINT fk_property_module_prop FOREIGN KEY (property_id) REFERENCES property_tbl(id) ON DELETE CASCADE
);
