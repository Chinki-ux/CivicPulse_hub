package com.civicrules.model;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 20)
    private String phone;

    @Column(length = 50)
    private String fullName; // Added for Edit Profile

    @Column(length = 20)
    private String phoneNumber; // Alternative field name

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.CITIZEN;

    @Column(length = 100)
    private String department; // For Officers

    @Column
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "zone")
    private String zone; // For Officers: "North Delhi", "South Delhi", etc.

    // Getter and Setter
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    @UpdateTimestamp
    @Column
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Grievance> grievances;

    @OneToMany(mappedBy = "assignedTo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Grievance> assignedGrievances;

    // Role Enum
    public enum Role {
        CITIZEN,
        OFFICER,
        ADMIN
    }

    // Constructors
    public User() {
    }

    public User(String name, String email, String password, Role role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getFullName() {
        return fullName != null ? fullName : name;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhoneNumber() {
        return phoneNumber != null ? phoneNumber : phone;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
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

    // ✅ YEH 3 METHODS ADD KARO

    public String getUsername() {
        return email; // Email ko username ki tarah use kar rahe ho
    }

    public void setUsername(String username) {
        this.email = username; // Ya separate username field banao
    }

    public void setActive(Boolean active) {
        this.isActive = active;
    }

    public LocalDateTime getLastLogin() {
        return updatedAt; // Ya separate lastLogin field banao
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.updatedAt = lastLogin; // Ya separate field use karo
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<Grievance> getGrievances() {
        return grievances;
    }

    public void setGrievances(List<Grievance> grievances) {
        this.grievances = grievances;
    }

    public List<Grievance> getAssignedGrievances() {
        return assignedGrievances;
    }

    public void setAssignedGrievances(List<Grievance> assignedGrievances) {
        this.assignedGrievances = assignedGrievances;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", role=" + role +
                ", createdAt=" + createdAt +
                '}';
    }
}