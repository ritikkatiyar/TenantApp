package com.tenantliving.common.event;

import org.springframework.context.ApplicationEvent;

public class IssueCreatedEvent extends ApplicationEvent {
    private final String issueId;
    private final String propertyName;
    private final String unitNumber;
    private final String creatorName;
    private final String title;
    private final String description;
    private final String recipientUserId;

    public IssueCreatedEvent(Object source, String issueId, String propertyName, String unitNumber,
                             String creatorName, String title, String description, String recipientUserId) {
        super(source);
        this.issueId = issueId;
        this.propertyName = propertyName;
        this.unitNumber = unitNumber;
        this.creatorName = creatorName;
        this.title = title;
        this.description = description;
        this.recipientUserId = recipientUserId;
    }

    public String getIssueId() {
        return issueId;
    }

    public String getPropertyName() {
        return propertyName;
    }

    public String getUnitNumber() {
        return unitNumber;
    }

    public String getCreatorName() {
        return creatorName;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getRecipientUserId() {
        return recipientUserId;
    }
}
