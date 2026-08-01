package com.livic.billing.service.interfaces;

import com.livic.billing.dto.PlanResponse;

import java.util.List;

public interface SubscriptionPlanQueryService {
    List<PlanResponse> getAllActivePlans();
}
