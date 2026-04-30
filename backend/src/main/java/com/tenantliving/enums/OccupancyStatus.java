package com.tenantliving.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum OccupancyStatus {
    ACTIVE("Active"),
    NOTICE_PERIOD("Notice Period"),
    PAST("Past/Moved Out");

    private final String displayName;

    OccupancyStatus(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static OccupancyStatus fromValue(String value) {
        for (OccupancyStatus status : values()) {
            if (status.displayName.equalsIgnoreCase(value) || status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid OccupancyStatus: " + value);
    }
}