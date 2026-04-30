package com.tenantliving.property;

import com.tenantliving.dto.PropertyDTOs;
import com.tenantliving.enums.FacingDirection;
import com.tenantliving.room.Room;
import com.tenantliving.room.RoomRepo;
import com.tenantliving.user.User;
import com.tenantliving.user.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepo propertyRepository;
    private final RoomRepo roomRepository;
    private final UserRepo userRepository;

    @Transactional
    public Property createProperty(PropertyDTOs.CreatePropertyRequest request, UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        Property property = Property.builder()
                .name(request.name())
                .address(request.address())
                .landmark(request.landmark())
                .owner(owner)
                .build();

        return propertyRepository.save(property);
    }

    @Transactional
    public List<Room> generateBatchRooms(UUID propertyId, PropertyDTOs.BatchRoomRequest request) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        List<Room> generatedRooms = new ArrayList<>();

        for (int currentFloor = request.startingFloorNumber();
             currentFloor < request.startingFloorNumber() + request.totalFloors();
             currentFloor++) {

            for (int roomIndex = 1; roomIndex <= request.roomsPerFloor(); roomIndex++) {
                // Generates e.g., "A-401" or just "401"
                String prefix = request.prefix() != null ? request.prefix() : "";
                String roomNumber = prefix + currentFloor + String.format("%02d", roomIndex);

                Room room = Room.builder()
                        .property(property)
                        .roomNumber(roomNumber)
                        .floor(currentFloor)
                        .gridY(currentFloor)
                        .gridX(roomIndex)
                        .type(request.roomType())
                        .facing(FacingDirection.UNKNOWN) // Default, can be updated later
                        .build();

                generatedRooms.add(room);
            }
        }
        return roomRepository.saveAll(generatedRooms);
    }
}