package com.civicrules.model;

import jakarta.persistence.*;

/**
 * Role Entity
 * Represents user roles in the system (ADMIN, OFFICER, OPERATOR, CITIZEN)
 */
@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name; // ROLE_ADMIN, ROLE_OFFICER, ROLE_OPERATOR, ROLE_CITIZEN

    // ========================================
    // CONSTRUCTORS
    // ========================================

    public Role() {
    }

    public Role(String name) {
        this.name = name;
    }

    public Role(Long id, String name) {
        this.id = id;
        this.name = name;
    }

    // ========================================
    // GETTERS AND SETTERS
    // ========================================

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

    // ========================================
    // UTILITY METHODS
    // ========================================

    @Override
    public String toString() {
        return "Role{" +
                "id=" + id +
                ", name='" + name + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        Role role = (Role) o;

        return name != null ? name.equals(role.name) : role.name == null;
    }

    @Override
    public int hashCode() {
        return name != null ? name.hashCode() : 0;
    }
}