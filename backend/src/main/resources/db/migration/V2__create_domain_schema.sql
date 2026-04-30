-- V2__create_domain_schema.sql

-- 1. USERS TABLE
CREATE TABLE users (
                       id VARCHAR(36) PRIMARY KEY,
                       auth_uid VARCHAR(255) NOT NULL UNIQUE,
                       full_name VARCHAR(255) NOT NULL,
                       phone_number VARCHAR(20) UNIQUE,
                       role VARCHAR(50) NOT NULL,
                       created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                       updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

-- 2. PROPERTIES TABLE
CREATE TABLE properties (
                            id VARCHAR(36) PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            address TEXT NOT NULL,
                            landmark VARCHAR(255),
                            owner_id VARCHAR(36) NOT NULL,
                            created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                            updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

                            CONSTRAINT fk_properties_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 3. ROOMS TABLE (Formerly Units)
CREATE TABLE rooms (
                       id VARCHAR(36) PRIMARY KEY,
                       property_id VARCHAR(36) NOT NULL,
                       room_number VARCHAR(50) NOT NULL,
                       floor INT NOT NULL,
                       grid_x INT NOT NULL,
                       grid_y INT NOT NULL,
                       type VARCHAR(50) NOT NULL,
                       facing VARCHAR(50),
                       created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                       updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

                       CONSTRAINT fk_rooms_property FOREIGN KEY (property_id) REFERENCES properties(id),
                       CONSTRAINT uk_property_room UNIQUE (property_id, room_number)
);

-- 4. OCCUPANCIES TABLE
CREATE TABLE occupancies (
                             id VARCHAR(36) PRIMARY KEY,
                             user_id VARCHAR(36) NOT NULL,
                             room_id VARCHAR(36) NOT NULL,
                             status VARCHAR(50) NOT NULL,
                             move_in_date DATE NOT NULL,
                             move_out_date DATE,
                             rent_amount DECIMAL(10, 2) NOT NULL,
                             created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                             updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

                             CONSTRAINT fk_occupancies_user FOREIGN KEY (user_id) REFERENCES users(id),
                             CONSTRAINT fk_occupancies_room FOREIGN KEY (room_id) REFERENCES rooms(id)
);