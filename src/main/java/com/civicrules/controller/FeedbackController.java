package com.civicrules.controller;

import com.civicrules.model.Feedback;
import com.civicrules.model.Grievance;
import com.civicrules.model.User;
import com.civicrules.repository.FeedbackRepository;
import com.civicrules.repository.GrievanceRepository;
import com.civicrules.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*")
public class FeedbackController {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private GrievanceRepository grievanceRepository;

    @Autowired
    private UserRepository userRepository;

    // ========================================
    // EXISTING ENDPOINTS (CITIZEN-FACING)
    // ========================================

    /**
     * Submit feedback for a resolved grievance
     */
    @PostMapping
    public ResponseEntity<?> submitFeedback(@RequestBody FeedbackRequest request) {
        try {
            // Validate grievance exists
            Grievance grievance = grievanceRepository.findById(request.getGrievanceId())
                    .orElseThrow(() -> new RuntimeException("Grievance not found"));

            // Check if grievance is resolved
            if (grievance.getStatus() != Grievance.Status.RESOLVED) {
                return ResponseEntity.badRequest()
                        .body("Feedback can only be submitted for resolved complaints");
            }

            // Validate user exists
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if feedback already exists
            if (feedbackRepository.existsByGrievanceId(request.getGrievanceId())) {
                return ResponseEntity.badRequest()
                        .body("Feedback already submitted for this complaint");
            }

            // Validate rating (1-5)
            if (request.getRating() < 1 || request.getRating() > 5) {
                return ResponseEntity.badRequest()
                        .body("Rating must be between 1 and 5");
            }

            // Create feedback
            Feedback feedback = new Feedback();
            feedback.setGrievance(grievance);
            feedback.setUser(user);
            feedback.setRating(request.getRating());
            feedback.setComment(request.getComment());
            feedback.setIsReopened(false);

            Feedback saved = feedbackRepository.save(feedback);

            // Update grievance with feedback status
            grievance.setFeedbackSubmitted(true);
            grievanceRepository.save(grievance);

            return ResponseEntity.ok(saved);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error submitting feedback: " + e.getMessage());
        }
    }

    /**
     * Reopen a complaint (low rating or dissatisfied)
     */
    @PostMapping("/reopen/{grievanceId}")
    public ResponseEntity<?> reopenComplaint(
            @PathVariable Long grievanceId,
            @RequestParam Long userId,
            @RequestParam(required = false) String reason
    ) {
        try {
            Grievance grievance = grievanceRepository.findById(grievanceId)
                    .orElseThrow(() -> new RuntimeException("Grievance not found"));

            // Check if user owns the grievance
            if (!grievance.getUser().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You can only reopen your own complaints");
            }

            // Reopen the complaint
            grievance.setStatus(Grievance.Status.PENDING);
            grievance.setVerificationStatus("PENDING");
            grievance.setFeedbackSubmitted(false);
            grievance.setReopenReason(reason);
            grievance.setUpdatedAt(LocalDateTime.now());

            grievanceRepository.save(grievance);

            // Mark feedback as reopened if exists
            Optional<Feedback> feedback = feedbackRepository.findByGrievanceId(grievanceId);
            feedback.ifPresent(f -> {
                f.setIsReopened(true);
                feedbackRepository.save(f);
            });

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Complaint reopened successfully");
            response.put("grievanceId", grievanceId);
            response.put("newStatus", "PENDING");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error reopening complaint: " + e.getMessage());
        }
    }

    /**
     * Get feedback for a specific grievance
     */
    @GetMapping("/grievance/{grievanceId}")
    public ResponseEntity<?> getFeedbackByGrievance(@PathVariable Long grievanceId) {
        try {
            Optional<Feedback> feedback = feedbackRepository.findByGrievanceId(grievanceId);

            if (feedback.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(feedback.get());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching feedback: " + e.getMessage());
        }
    }

    /**
     * Get all feedback submitted by a user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getFeedbackByUser(@PathVariable Long userId) {
        try {
            List<Feedback> feedbackList = feedbackRepository.findByUserId(userId);
            return ResponseEntity.ok(feedbackList);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching user feedback: " + e.getMessage());
        }
    }

    /**
     * Get all feedback (Admin only) - BASIC VERSION
     */
    @GetMapping
    public ResponseEntity<?> getAllFeedback() {
        try {
            List<Feedback> feedbackList = feedbackRepository.findAll();
            return ResponseEntity.ok(feedbackList);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching feedback: " + e.getMessage());
        }
    }

    /**
     * Delete feedback (Admin only)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFeedback(@PathVariable Long id) {
        try {
            feedbackRepository.deleteById(id);
            return ResponseEntity.ok().body("Feedback deleted successfully");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting feedback: " + e.getMessage());
        }
    }

    // ========================================
    // ✅ NEW: ADMIN-SPECIFIC ENDPOINTS
    // ========================================

    /**
     * ✅ Get all feedback with grievance details (for Admin Dashboard)
     */
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllFeedbackForAdmin() {
        try {
            List<Feedback> allFeedback = feedbackRepository.findAllByOrderByCreatedAtDesc();

            List<Map<String, Object>> feedbackList = allFeedback.stream()
                    .map(this::mapFeedbackToDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(feedbackList);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching feedback: " + e.getMessage());
        }
    }

    /**
     * ✅ Get pending feedback (resolved complaints without feedback)
     */
    @GetMapping("/admin/pending")
    public ResponseEntity<?> getPendingFeedback() {
        try {
            // Get all resolved grievances
            List<Grievance> resolvedGrievances = grievanceRepository
                    .findByStatus(Grievance.Status.RESOLVED);

            // Filter those without feedback
            List<Map<String, Object>> pendingList = resolvedGrievances.stream()
                    .filter(g -> !feedbackRepository.existsByGrievanceId(g.getId()))
                    .map(this::mapGrievanceToPendingFeedback)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(pendingList);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching pending feedback: " + e.getMessage());
        }
    }

    /**
     * ✅ Get reopened complaints
     */
    @GetMapping("/admin/reopened")
    public ResponseEntity<?> getReopenedComplaints() {
        try {
            List<Feedback> reopened = feedbackRepository.findByIsReopened(true);

            List<Map<String, Object>> reopenedList = reopened.stream()
                    .map(this::mapFeedbackToDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(reopenedList);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching reopened complaints: " + e.getMessage());
        }
    }

    /**
     * ✅ Get feedback statistics for admin dashboard (ENHANCED VERSION)
     */
    @GetMapping("/admin/stats")
    public ResponseEntity<?> getAdminFeedbackStats() {
        try {
            List<Feedback> allFeedback = feedbackRepository.findAll();
            List<Grievance> resolvedGrievances = grievanceRepository
                    .findByStatus(Grievance.Status.RESOLVED);

            long totalResolved = resolvedGrievances.size();
            long feedbackReceived = allFeedback.size();
            long pendingFeedback = resolvedGrievances.stream()
                    .filter(g -> !feedbackRepository.existsByGrievanceId(g.getId()))
                    .count();
            long reopenedCount = feedbackRepository.findByIsReopened(true).size();

            // Calculate average rating
            double avgRating = allFeedback.stream()
                    .filter(f -> f.getRating() != null)
                    .mapToInt(Feedback::getRating)
                    .average()
                    .orElse(0.0);

            // Rating distribution
            Map<Integer, Long> ratingDistribution = allFeedback.stream()
                    .filter(f -> f.getRating() != null)
                    .collect(Collectors.groupingBy(
                            Feedback::getRating,
                            Collectors.counting()
                    ));

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalResolved", totalResolved);
            stats.put("feedbackReceived", feedbackReceived);
            stats.put("pendingFeedback", pendingFeedback);
            stats.put("reopenedCount", reopenedCount);
            stats.put("averageRating", Math.round(avgRating * 10.0) / 10.0);
            stats.put("feedbackRate", totalResolved > 0 ?
                    Math.round((double) feedbackReceived / totalResolved * 100) : 0);
            stats.put("ratingDistribution", ratingDistribution);

            // Also include basic stats for backwards compatibility
            stats.put("totalFeedback", feedbackReceived);
            stats.put("fiveStarCount", ratingDistribution.getOrDefault(5, 0L));
            stats.put("fourStarCount", ratingDistribution.getOrDefault(4, 0L));
            stats.put("threeStarCount", ratingDistribution.getOrDefault(3, 0L));
            stats.put("twoStarCount", ratingDistribution.getOrDefault(2, 0L));
            stats.put("oneStarCount", ratingDistribution.getOrDefault(1, 0L));

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error calculating stats: " + e.getMessage());
        }
    }

    /**
     * Original stats endpoint for backwards compatibility
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getFeedbackStats() {
        try {
            List<Feedback> allFeedback = feedbackRepository.findAll();

            long totalFeedback = allFeedback.size();
            long fiveStarCount = feedbackRepository.findByRating(5).size();
            long fourStarCount = feedbackRepository.findByRating(4).size();
            long threeStarCount = feedbackRepository.findByRating(3).size();
            long twoStarCount = feedbackRepository.findByRating(2).size();
            long oneStarCount = feedbackRepository.findByRating(1).size();

            double averageRating = allFeedback.stream()
                    .mapToInt(Feedback::getRating)
                    .average()
                    .orElse(0.0);

            long reopenedCount = feedbackRepository.findByIsReopened(true).size();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalFeedback", totalFeedback);
            stats.put("averageRating", Math.round(averageRating * 10.0) / 10.0);
            stats.put("fiveStarCount", fiveStarCount);
            stats.put("fourStarCount", fourStarCount);
            stats.put("threeStarCount", threeStarCount);
            stats.put("twoStarCount", twoStarCount);
            stats.put("oneStarCount", oneStarCount);
            stats.put("reopenedCount", reopenedCount);

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error calculating statistics: " + e.getMessage());
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Map Feedback to DTO with all details
     */
    private Map<String, Object> mapFeedbackToDTO(Feedback feedback) {
        Map<String, Object> dto = new HashMap<>();

        dto.put("id", feedback.getId());
        dto.put("rating", feedback.getRating());
        dto.put("comments", feedback.getComment()); // Using getComment() from your model
        dto.put("isReopened", feedback.getIsReopened());
        dto.put("createdAt", feedback.getCreatedAt());

        // Grievance details
        if (feedback.getGrievance() != null) {
            Grievance g = feedback.getGrievance();
            Map<String, Object> grievanceDto = new HashMap<>();
            grievanceDto.put("id", g.getId());
            grievanceDto.put("title", g.getTitle());
            grievanceDto.put("category", g.getCategory());
            grievanceDto.put("location", g.getLocation());
            grievanceDto.put("status", g.getStatus().toString());
            grievanceDto.put("resolvedAt", g.getResolvedAt());
            dto.put("grievance", grievanceDto);
        }

        // User details
        if (feedback.getUser() != null) {
            Map<String, Object> userDto = new HashMap<>();
            userDto.put("id", feedback.getUser().getId());
            userDto.put("name", feedback.getUser().getName());
            userDto.put("email", feedback.getUser().getEmail());
            dto.put("user", userDto);
        }

        return dto;
    }

    /**
     * Map Grievance to Pending Feedback DTO
     */
    private Map<String, Object> mapGrievanceToPendingFeedback(Grievance g) {
        Map<String, Object> dto = new HashMap<>();

        dto.put("grievanceId", g.getId());
        dto.put("title", g.getTitle());
        dto.put("category", g.getCategory());
        dto.put("location", g.getLocation());
        dto.put("resolvedAt", g.getResolvedAt());
        dto.put("status", "PENDING_FEEDBACK");

        if (g.getUser() != null) {
            Map<String, Object> userDto = new HashMap<>();
            userDto.put("id", g.getUser().getId());
            userDto.put("name", g.getUser().getName());
            userDto.put("email", g.getUser().getEmail());
            dto.put("user", userDto);
        }

        return dto;
    }

    // ========================================
    // REQUEST DTOs
    // ========================================

    /**
     * Request DTO for submitting feedback
     */
    static class FeedbackRequest {
        private Long grievanceId;
        private Long userId;
        private Integer rating;
        private String comment;

        public FeedbackRequest() {
        }

        public Long getGrievanceId() {
            return grievanceId;
        }

        public void setGrievanceId(Long grievanceId) {
            this.grievanceId = grievanceId;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public Integer getRating() {
            return rating;
        }

        public void setRating(Integer rating) {
            this.rating = rating;
        }

        public String getComment() {
            return comment;
        }

        public void setComment(String comment) {
            this.comment = comment;
        }
    }
}