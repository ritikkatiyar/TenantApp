CREATE TABLE charge_config_tbl (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    property_id VARCHAR(36) NOT NULL,
    charge_name VARCHAR(100) NOT NULL,
    charge_category VARCHAR(50) NOT NULL,
    billing_frequency VARCHAR(50) NOT NULL,
    calculation_strategy VARCHAR(50) NOT NULL,
    base_rate DECIMAL(10, 2) NOT NULL,
    apply_sales_tax BOOLEAN NOT NULL,
    late_fee_percentage DECIMAL(5, 2),
    is_system_required BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_charge_config_property FOREIGN KEY (property_id) REFERENCES property_tbl(id)
);

ALTER TABLE rent_cycle_charge_tbl
ADD COLUMN charge_config_id VARCHAR(36);

ALTER TABLE rent_cycle_charge_tbl
ADD CONSTRAINT fk_rent_cycle_charge_config FOREIGN KEY (charge_config_id) REFERENCES charge_config_tbl(id);
