package com.tenantliving.ai.config;

import java.util.UUID;

/**
 * Thread-local holder for the userId of the job currently being processed.
 * Set by AIJobEventListener before executing the job,
 * read by tool implementations (e.g. PropertyTool) to resolve the acting user.
 */
public final class AIJobContext {

    private static final ThreadLocal<UUID> CURRENT_USER_ID = new ThreadLocal<>();

    private AIJobContext() {}

    public static void setUserId(UUID userId) {
        CURRENT_USER_ID.set(userId);
    }

    public static UUID getUserId() {
        return CURRENT_USER_ID.get();
    }

    public static void clear() {
        CURRENT_USER_ID.remove();
    }
}
