package com.livic.common.event;

import org.springframework.context.ApplicationEvent;
import java.util.List;

public class AnnouncementBroadcastEvent extends ApplicationEvent {
    private final String announcementId;
    private final String title;
    private final String content;
    private final String category;
    private final String severity;
    private final List<String> recipientUserIds;

    public AnnouncementBroadcastEvent(Object source, String announcementId, String title, String content,
                                      String category, String severity, List<String> recipientUserIds) {
        super(source);
        this.announcementId = announcementId;
        this.title = title;
        this.content = content;
        this.category = category;
        this.severity = severity;
        this.recipientUserIds = recipientUserIds;
    }

    public String getAnnouncementId() {
        return announcementId;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public String getCategory() {
        return category;
    }

    public String getSeverity() {
        return severity;
    }

    public List<String> getRecipientUserIds() {
        return recipientUserIds;
    }
}
