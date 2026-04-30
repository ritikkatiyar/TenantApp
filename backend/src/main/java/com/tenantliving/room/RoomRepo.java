package com.tenantliving.room;

import com.tenantliving.room.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface RoomRepo extends JpaRepository<Room, UUID> {

    // Used to fetch the grid data for the React Native 3D visualizer
    List<Room> findByPropertyId(UUID propertyId);

    // Safety check during manual room creation to prevent duplicates (e.g., two "Room 402"s)
    boolean existsByPropertyIdAndRoomNumber(UUID propertyId, String roomNumber);

    // Fetch a specific floor's rooms for targeted updates
    List<Room> findByPropertyIdAndFloor(UUID propertyId, Integer floor);
}