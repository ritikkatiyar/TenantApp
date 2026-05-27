CREATE TABLE meter_reading_tbl (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    
    property_id VARCHAR(36) NOT NULL,
    unit_id VARCHAR(36) NOT NULL,
    charge_config_id VARCHAR(36) NOT NULL,
    
    billing_month INT NOT NULL,
    billing_year INT NOT NULL,
    
    previous_reading DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    current_reading DECIMAL(10, 2),
    is_billed BOOLEAN NOT NULL DEFAULT FALSE,
    
    CONSTRAINT fk_meter_property FOREIGN KEY (property_id) REFERENCES property_tbl(id),
    CONSTRAINT fk_meter_unit FOREIGN KEY (unit_id) REFERENCES unit_tbl(id),
    CONSTRAINT fk_meter_charge_config FOREIGN KEY (charge_config_id) REFERENCES charge_config_tbl(id),
    
    -- Ensure we only have one reading per unit per charge type per month
    CONSTRAINT uk_meter_reading UNIQUE (unit_id, charge_config_id, billing_month, billing_year)
);
