CREATE TABLE IF NOT EXISTS property_amenities_tbl (
    property_id varchar(36) NOT NULL,
    amenity varchar(255) NOT NULL,
    PRIMARY KEY (property_id, amenity),
    CONSTRAINT fk_property_amenities_property FOREIGN KEY (property_id) REFERENCES property_tbl(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO property_amenities_tbl (property_id, amenity)
SELECT id, 'High-speed Fiber Wi-Fi' FROM property_tbl
UNION ALL
SELECT id, 'Rooftop Pool' FROM property_tbl
UNION ALL
SELECT id, 'Covered Parking' FROM property_tbl
UNION ALL
SELECT id, '24/7 Fitness Center' FROM property_tbl
UNION ALL
SELECT id, '24/7 Security' FROM property_tbl
UNION ALL
SELECT id, 'Power Backup' FROM property_tbl;
