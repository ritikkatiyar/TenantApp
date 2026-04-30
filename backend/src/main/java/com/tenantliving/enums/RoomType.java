package com.tenantliving.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RoomType {
    SINGLE_ROOM("Single Room"),
    SHARED_ROOM("Shared Room"),
    ONE_BHK("1 BHK"),
    TWO_BHK("2 BHK"),
    STUDIO("Studio Apartment");

    private final String displayName;

    RoomType(String displayName) {
        this.displayName = displayName;
    }

    // Tells Spring/Jackson to output this value in API responses
    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    // Safely handles incoming JSON requests (accepts both "1 BHK" and "ONE_BHK")
    @JsonCreator
    public static RoomType fromValue(String value) {
        for (RoomType type : values()) {
            if (type.displayName.equalsIgnoreCase(value) || type.name().equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid RoomType: " + value);
    }
}