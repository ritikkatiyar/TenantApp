package com.tenantliving.dto;

import com.tenantliving.enums.RoomType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PropertyDTOs {

    public record CreatePropertyRequest(
            @NotBlank(message = "Property name is required")
            String name,

            @NotBlank(message = "Address is required")
            String address,

            String landmark
    ) {}

    public record BatchRoomRequest(
            @Min(value = 1, message = "Must have at least 1 floor")
            int totalFloors,

            @Min(value = 1, message = "Must have at least 1 room per floor")
            int roomsPerFloor,

            int startingFloorNumber,

            String prefix,

            @NotNull(message = "Room type is required")
            RoomType roomType
    ) {}
}