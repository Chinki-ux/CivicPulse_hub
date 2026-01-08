package com.civicrules.repository;

import com.civicrules.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {


    // ⭐ NEW: Find officers by department
    List<User> findByRoleAndDepartment(User.Role role, String department);
    /**
     * Find user by email
     */
    Optional<User> findByEmail(String email);

    /**
     * Find users by role
     */
    List<User> findByRole(User.Role role);

    /**
     * Find active users
     */
    List<User> findByIsActive(Boolean isActive);

    /**
     * Find users by department (for officers)
     */
    List<User> findByDepartment(String department);

    /**
     * Find users by role and active status
     */
    List<User> findByRoleAndIsActive(User.Role role, Boolean isActive);

    /**
     * Check if email exists
     */
    Boolean existsByEmail(String email);

    /**
     * Count users by role
     */
    Long countByRole(User.Role role);

    /**
     * Find officers (role = OFFICER)
     */
    default List<User> findAllOfficers() {
        return findByRole(User.Role.OFFICER);
    }

    /**
     * Find citizens (role = CITIZEN)
     */
    default List<User> findAllCitizens() {
        return findByRole(User.Role.CITIZEN);
    }
}