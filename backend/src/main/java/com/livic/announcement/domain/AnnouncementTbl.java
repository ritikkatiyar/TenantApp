package com.livic.announcement.domain;

import com.livic.common.domain.BaseEntity;
import com.livic.property.domain.PropertyTbl;
import com.livic.user.domain.UserTbl;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "announcement_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
public class AnnouncementTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @ToString.Exclude
    private PropertyTbl property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    @ToString.Exclude
    private UserTbl creator;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AnnouncementCategory category = AnnouncementCategory.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AnnouncementSeverity severity = AnnouncementSeverity.INFO;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    @Builder.Default
    private AnnouncementTargetType targetType = AnnouncementTargetType.PROPERTY;

    @Column(name = "target_value")
    private String targetValue;

    @Column(columnDefinition = "JSON")
    private String metadata;
}
