package com.tenantliving.room;

import com.tenantliving.base.BaseEntity;
import com.tenantliving.enums.FacingDirection;
import com.tenantliving.enums.RoomType;
import com.tenantliving.property.Property;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rooms", uniqueConstraints = {
        // Ensures a landlord can't accidentally create two "Room 402"s in the same property
        @UniqueConstraint(columnNames = {"property_id", "room_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @ToString.Exclude
    private Property property;

    @Column(name = "room_number", nullable = false)
    private String roomNumber;

    @Column(nullable = false)
    private Integer floor;

    @Column(name = "grid_x", nullable = false)
    private Integer gridX;

    @Column(name = "grid_y", nullable = false)
    private Integer gridY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomType type;

    @Enumerated(EnumType.STRING)
    private FacingDirection facing;
}