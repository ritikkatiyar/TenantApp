package com.livic.issue.facade.impl;

import com.livic.issue.facade.IssueFacade;
import com.livic.issue.service.interfaces.IssueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class IssueFacadeImpl implements IssueFacade {

    private final IssueService issueService;
}
