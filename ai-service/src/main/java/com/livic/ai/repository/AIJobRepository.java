package com.livic.ai.repository;

import com.livic.ai.domain.AIJobTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AIJobRepository extends JpaRepository<AIJobTbl, UUID> {
}
