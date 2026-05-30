package com.tenantliving.ai.repository;

import com.tenantliving.ai.domain.AIJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AIJobRepository extends JpaRepository<AIJob, UUID> {
}
