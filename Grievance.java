package com.civicrules.model;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@Entity
@Table(name = "grievances")
public class Grievance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 500)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description; // ✅ Can be NULL or empty

    @Column(length = 255)
    private String imagePath;

    // ADD THESE 3 LINES:
    @Column(length = 50)
    private String verificationStatus = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(columnDefinition = "TEXT")
    private String verificationReason;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Status status = Status.PENDING;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "citizen_id", nullable = false)
    @JsonIgnoreProperties({"grievances", "password", "hibernateLazyInitializer", "handler"}) // ADD
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_to")
    @JsonIgnoreProperties({"grievances", "password", "hibernateLazyInitializer", "handler"}) // ADD
    private User assignedTo; // Officer assigned to handle

    @Column(length = 100)
    private String department; // "Water Supply", "Infrastructure", etc.

    @Column(columnDefinition = "TEXT")
    private String officerRemarks;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime resolvedAt;
    @Column
    private Boolean feedbackSubmitted = false;

    @Column(columnDefinition = "TEXT")
    private String reopenReason;

    // Status Enum
    public enum Status {
        PENDING,
        IN_PROGRESS,
        RESOLVED,
        CLOSED,
        REJECTED
    }

    // Constructors
    public Grievance() {
    }

    public Grievance(String title, String category, String location, String description,
                     String imagePath, Status status, User user) {
        this.title = title;
        this.category = category;
        this.location = location;
        this.description = description;
        this.imagePath = imagePath;
        this.status = status;
        this.user = user;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public User getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(User assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getOfficerRemarks() {
        return officerRemarks;
    }

    public void setOfficerRemarks(String officerRemarks) {
        this.officerRemarks = officerRemarks;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
    // ADD THESE METHODS:
    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public Boolean getFeedbackSubmitted() {
        return feedbackSubmitted;
    }

    public void setFeedbackSubmitted(Boolean feedbackSubmitted) {
        this.feedbackSubmitted = feedbackSubmitted;
    }

    public String getReopenReason() {
        return reopenReason;
    }

    public void setReopenReason(String reopenReason) {
        this.reopenReason = reopenReason;
    }

    public String getVerificationReason() {
        return verificationReason;
    }

    public void setVerificationReason(String verificationReason) {
        this.verificationReason = verificationReason;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
    @Override
    public String toString() {
        return "Grievance{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", category='" + category + '\'' +
                ", status=" + status +
                ", user=" + (user != null ? user.getId() : null) +
                ", createdAt=" + createdAt +
                '}';
    }
}