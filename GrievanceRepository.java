package com.civicrules.repository;

import com.civicrules.model.Grievance;
import com.civicrules.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrievanceRepository extends JpaRepository<Grievance, Long> {

    List<Grievance> findByUser(User user);

    List<Grievance> findByDepartment(String department);

    List<Grievance> findByUserId(Long userId);

    List<Grievance> findByStatus(Grievance.Status status);

    List<Grievance> findByCategory(String category);

    @Query("SELECT g FROM Grievance g WHERE LOWER(g.category) = LOWER(:category)")
    List<Grievance> findByCategoryIgnoreCase(@Param("category") String category);

    List<Grievance> findByAssignedTo(User assignedTo);

    List<Grievance> findByAssignedToId(Long assignedToId);

    List<Grievance> findByStatusAndUserId(Grievance.Status status, Long userId);

    List<Grievance> findByOrderByCreatedAtDesc();

    List<Grievance> findByUserIdOrderByCreatedAtDesc(Long userId);

    // ✅ NEW: Verification-related queries
    List<Grievance> findByVerificationStatus(String verificationStatus);

    List<Grievance> findByVerificationStatusOrderByCreatedAtDesc(String verificationStatus);

    @Query("SELECT g FROM Grievance g WHERE g.verificationStatus = 'PENDING' ORDER BY g.createdAt DESC")
    List<Grievance> findPendingVerification();

    @Query("SELECT g FROM Grievance g WHERE g.verificationStatus = 'APPROVED' AND g.assignedTo IS NULL ORDER BY g.createdAt DESC")
    List<Grievance> findApprovedAndUnassigned();

    @Query("SELECT g FROM Grievance g WHERE g.status = :status AND g.verificationStatus = :verificationStatus")
    List<Grievance> findByStatusAndVerificationStatus(
            @Param("status") Grievance.Status status,
            @Param("verificationStatus") String verificationStatus
    );

    long countByVerificationStatus(String verificationStatus);

    long countByStatus(Grievance.Status status);

}