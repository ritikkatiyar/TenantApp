package com.livic.issue.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.issue.domain.IssueTimelineTbl;
import java.util.List;
import java.util.UUID;

public interface IssueTimelineCrudService extends CrudService<IssueTimelineTbl, UUID> {
    List<IssueTimelineTbl> findByIssueIdOrderByCreatedAtAsc(UUID issueId);
}
