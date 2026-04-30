package com.tenantliving.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum UserRole {
    USER("User"),
    SUPER_ADMIN("SuperAdmin"),
    ADMIN("Admin"),
    PROPERTY_STAFF("PropertyStaff");

    private final String displayName;

    UserRole(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static UserRole fromValue(String value) {
        for (UserRole role : values()) {
            if (role.displayName.equalsIgnoreCase(value) || role.name().equalsIgnoreCase(value)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Invalid UserRole: " + value);
    }
}