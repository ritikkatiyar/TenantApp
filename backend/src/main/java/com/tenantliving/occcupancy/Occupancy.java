package com.tenantliving.occcupancy;

import com.tenantliving.base.BaseEntity;
import com.tenantliving.enums.OccupancyStatus;
import com.tenantliving.room.Room;
import com.tenantliving.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;

@Entity
@Table(name = "occupancies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Occupancy extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    @ToString.Exclude
    private Room room;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OccupancyStatus status;

    @Column(name = "move_in_date", nullable = false)
    private LocalDate moveInDate;

    @Column(name = "move_out_date")
    private LocalDate moveOutDate;

    @Column(name = "rent_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal rentAmount;
}