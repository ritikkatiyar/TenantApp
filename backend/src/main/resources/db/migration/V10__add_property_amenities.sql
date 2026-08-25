CREATE TABLE IF NOT EXISTS property_amenities_tbl (
    property_id UUID NOT NULL REFERENCES property_tbl(id) ON DELETE CASCADE,
    amenity VARCHAR(255) NOT NULL,
    PRIMARY KEY (property_id, amenity)
);

INSERT INTO property_amenities_tbl (property_id, amenity)
SELECT id, unnest(ARRAY['High-speed Fiber Wi-Fi', 'Rooftop Pool', 'Covered Parking', '24/7 Fitness Center', '24/7 Security', 'Power Backup'])
FROM property_tbl
ON CONFLICT DO NOTHING;
