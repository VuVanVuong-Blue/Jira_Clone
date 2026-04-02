package com.jira.clone.repositories;

import com.jira.clone.models.entities.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabelRepository extends JpaRepository<Label, Long> {
    List<Label> findByProjectId(Long projectId);
    Optional<Label> findByProjectIdAndName(Long projectId, String name);
}
