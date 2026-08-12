package com.livic.issue.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.issue.domain.IssueEscalationStatus;
import com.livic.issue.domain.IssueStatus;
import com.livic.issue.domain.IssueTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface IssueCrudService extends CrudService<IssueTbl, UUID> {
    Page<IssueTbl> findByPropertyId(UUID propertyId, Pageable pageable);
    Page<IssueTbl> findByLeaseId(UUID leaseId, Pageable pageable);
    Page<IssueTbl> findByPropertyIdIn(Collection<UUID> propertyIds, Pageable pageable);
    List<IssueTbl> findByStatusInAndEscalationStatus(Collection<IssueStatus> statuses, IssueEscalationStatus escalationStatus);
}
