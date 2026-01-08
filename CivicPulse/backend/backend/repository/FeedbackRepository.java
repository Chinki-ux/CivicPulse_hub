package com.civicrules.repository;

import com.civicrules.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    // Find feedback by grievance ID
    Optional<Feedback> findByGrievanceId(Long grievanceId);

    // Find all feedback by user
    List<Feedback> findByUserId(Long userId);

    // Find feedback by rating
    List<Feedback> findByRating(Integer rating);

    // Find all feedback where complaints were reopened
    List<Feedback> findByIsReopened(Boolean isReopened);

    // Check if feedback exists for a grievance
    boolean existsByGrievanceId(Long grievanceId);
}