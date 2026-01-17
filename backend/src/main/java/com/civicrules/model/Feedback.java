package com.civicrules.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "grievance_id", nullable = false)
    private Grievance grievance;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer rating; // 1 to 5 stars

    @Column(columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private Boolean isReopened = false;

    // Constructors
    public Feedback() {
    }

    public Feedback(Grievance grievance, User user, Integer rating, String comment) {
        this.grievance = grievance;
        this.user = user;
        this.rating = rating;
        this.comment = comment;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Grievance getGrievance() {
        return grievance;
    }

    public void setGrievance(Grievance grievance) {
        this.grievance = grievance;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getIsReopened() {
        return isReopened;
    }

    public void setIsReopened(Boolean isReopened) {
        this.isReopened = isReopened;
    }

    @Override
    public String toString() {
        return "Feedback{" +
                "id=" + id +
                ", grievanceId=" + (grievance != null ? grievance.getId() : null) +
                ", userId=" + (user != null ? user.getId() : null) +
                ", rating=" + rating +
                ", createdAt=" + createdAt +
                '}';
    }
}