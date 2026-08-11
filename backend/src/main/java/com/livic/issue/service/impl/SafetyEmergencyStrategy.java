package com.livic.issue.service.impl;

import com.livic.issue.domain.IssueCategory;
import com.livic.issue.domain.IssueEscalationStatus;
import com.livic.issue.domain.IssueTbl;
import com.livic.issue.service.interfaces.EscalationStrategy;
import org.springframework.stereotype.Component;

@Component
public class SafetyEmergencyStrategy implements EscalationStrategy {
    @Override
    public boolean shouldEscalate(IssueTbl issue) {
        return issue != null 
                && issue.getCategory() == IssueCategory.SAFETY 
                && issue.getEscalationStatus() != IssueEscalationStatus.ESCALATED;
    }
}
