package com.livic.issue.service.interfaces;

import com.livic.issue.domain.IssueTbl;

public interface EscalationStrategy {
    boolean shouldEscalate(IssueTbl issue);
}
