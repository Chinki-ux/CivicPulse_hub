package com.civicrules.controller;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import com.civicrules.model.Grievance;
import com.civicrules.model.Officer;
import com.civicrules.model.User;
import com.civicrules.repository.GrievanceRepository;
import com.civicrules.repository.OfficerRepository;
import com.civicrules.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/grievances")
@CrossOrigin(origins = "*", maxAge = 3600)
public class GrievanceController {

    @Autowired
    private GrievanceRepository grievanceRepository;

    @Autowired
    private OfficerRepository officerRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${upload.path:./uploads}")
    private String uploadPath;

    /**
     * ✅ FIXED: Submit Grievance with Image Upload + Auto Department Assignment
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> submitGrievance(
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam("location") String location,
            @RequestParam(value = "description", required = false, defaultValue = "") String description,
            @RequestParam("citizenId") Long citizenId,
            @RequestParam("status") String status,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam("image") MultipartFile image
    ) {
        try {
            // Validate image
            if (image.isEmpty()) {
                return ResponseEntity.badRequest().body("Image is required");
            }

            // Validate image size (5MB max)
            if (image.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body("Image size must be less than 5MB");
            }

            // Validate image type
            String contentType = image.getContentType();
            if (contentType == null ||
                    !(contentType.equals("image/jpeg") ||
                            contentType.equals("image/jpg") ||
                            contentType.equals("image/png"))) {
                return ResponseEntity.badRequest().body("Only JPG, JPEG, and PNG images are allowed");
            }

            // Find user
            User user = userRepository.findById(citizenId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Create uploads directory if not exists
            File uploadDir = new File(uploadPath);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // Generate unique filename
            String originalFilename = image.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = Paths.get(uploadPath, filename);
            Files.write(filePath, image.getBytes());

            // Create Grievance object
            Grievance grievance = new Grievance();
            grievance.setTitle(title);
            grievance.setCategory(category);
            grievance.setLocation(location);
            grievance.setDescription(description);
            grievance.setImagePath(filename);
            grievance.setUser(user);

            // ✅ KEEP DEPARTMENT SAME AS CATEGORY (NO MAPPING)
            grievance.setDepartment(category);

            // Set status enum
            try {
                grievance.setStatus(Grievance.Status.valueOf(status));
            } catch (IllegalArgumentException e) {
                grievance.setStatus(Grievance.Status.PENDING);
            }

            grievance.setLatitude(latitude);
            grievance.setLongitude(longitude);
            grievance.setCreatedAt(LocalDateTime.now());
            grievance.setVerificationStatus("PENDING");

            // Save to database
            Grievance savedGrievance = grievanceRepository.save(grievance);

            return ResponseEntity.ok(savedGrievance);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload image: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error submitting grievance: " + e.getMessage());
        }
    }

    /**
     * ✅ FIXED: Get grievances by officer's department
     */
    @GetMapping("/officer/{officerId}")
    public ResponseEntity<List<Grievance>> getGrievancesByOfficer(@PathVariable Long officerId) {
        Officer officer = officerRepository.findById(officerId).orElse(null);

        if (officer == null) {
            return ResponseEntity.notFound().build();
        }

        String officerDepartment = officer.getDepartment();

        // ✅ Use category instead of department field
        List<Grievance> grievances = grievanceRepository.findByCategoryIgnoreCase(officerDepartment);

        return ResponseEntity.ok(grievances);
    }

    /**
     * Get grievance statistics for a citizen (for dashboard)
     */
    @GetMapping("/citizen/{citizenId}/stats")
    public ResponseEntity<GrievanceStats> getGrievanceStats(@PathVariable Long citizenId) {
        try {
            List<Grievance> grievances = grievanceRepository.findByUserId(citizenId);

            long total = grievances.size();
            long pending = grievances.stream()
                    .filter(g -> g.getStatus() == Grievance.Status.PENDING ||
                            g.getStatus() == Grievance.Status.IN_PROGRESS)
                    .count();
            long resolved = grievances.stream()
                    .filter(g -> g.getStatus() == Grievance.Status.RESOLVED)
                    .count();

            return ResponseEntity.ok(new GrievanceStats(total, pending, resolved));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ✅ FIXED: Get all grievances for a specific citizen - NO CIRCULAR REFERENCE
     */
    @GetMapping("/citizen/{citizenId}")
    public ResponseEntity<?> getCitizenGrievances(@PathVariable Long citizenId) {
        try {
            System.out.println("📋 Fetching grievances for citizen ID: " + citizenId);

            List<Grievance> grievances = grievanceRepository.findByUserIdOrderByCreatedAtDesc(citizenId);

            System.out.println("✅ Found " + grievances.size() + " grievances");

            // Convert to simple DTOs to avoid serialization issues
            List<Map<String, Object>> simplifiedList = new ArrayList<>();

            for (Grievance g : grievances) {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", g.getId());
                dto.put("title", g.getTitle());
                dto.put("category", g.getCategory());
                dto.put("location", g.getLocation());
                dto.put("description", g.getDescription());
                dto.put("status", g.getStatus().toString());
                dto.put("imagePath", g.getImagePath());
                dto.put("createdAt", g.getCreatedAt());
                dto.put("latitude", g.getLatitude());
                dto.put("longitude", g.getLongitude());
                dto.put("department", g.getDepartment());
                dto.put("verificationStatus", g.getVerificationStatus());

                simplifiedList.add(dto);
            }

            System.out.println("✅ Returning " + simplifiedList.size() + " simplified DTOs");

            return ResponseEntity.ok(simplifiedList);

        } catch (Exception e) {
            System.err.println("❌ Error fetching grievances: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    /**
     * Get single grievance by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Grievance> getGrievance(@PathVariable Long id) {
        try {
            Grievance grievance = grievanceRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Grievance not found"));
            return ResponseEntity.ok(grievance);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all grievances (for admin/officer)
     */
    @GetMapping
    public ResponseEntity<?> getAllGrievances() {
        try {
            List<Grievance> grievances = grievanceRepository.findByOrderByCreatedAtDesc();

            // Convert to simplified DTOs
            List<Map<String, Object>> result = new ArrayList<>();

            for (Grievance g : grievances) {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", g.getId());
                dto.put("title", g.getTitle());
                dto.put("category", g.getCategory());
                dto.put("location", g.getLocation());
                dto.put("description", g.getDescription());
                dto.put("status", g.getStatus().toString());
                dto.put("imagePath", g.getImagePath());
                dto.put("createdAt", g.getCreatedAt());
                dto.put("department", g.getDepartment());
                dto.put("verificationStatus", g.getVerificationStatus());
                dto.put("rejectionReason", g.getRejectionReason());

                // Add user info safely
                if (g.getUser() != null) {
                    Map<String, Object> userInfo = new HashMap<>();
                    userInfo.put("id", g.getUser().getId());
                    userInfo.put("name", g.getUser().getFullName());
                    userInfo.put("email", g.getUser().getEmail());
                    dto.put("user", userInfo);
                }

                // Add assigned officer info safely
                if (g.getAssignedTo() != null) {
                    Map<String, Object> officerInfo = new HashMap<>();
                    officerInfo.put("id", g.getAssignedTo().getId());
                    officerInfo.put("name", g.getAssignedTo().getFullName());
                    dto.put("assignedTo", officerInfo);
                }

                result.add(dto);
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    /**
     * Get grievances by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Grievance>> getGrievancesByStatus(@PathVariable String status) {
        try {
            Grievance.Status grievanceStatus = Grievance.Status.valueOf(status);
            List<Grievance> grievances = grievanceRepository.findByStatus(grievanceStatus);
            return ResponseEntity.ok(grievances);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get grievances by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Grievance>> getGrievancesByCategory(@PathVariable String category) {
        try {
            List<Grievance> grievances = grievanceRepository.findByCategory(category);
            return ResponseEntity.ok(grievances);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ✅ SUPER FIXED: Get grievances assigned to officer by department
     */
    @GetMapping("/assigned/{officerId}")
    public ResponseEntity<List<Grievance>> getOfficerAssignedGrievances(@PathVariable Long officerId) {
        try {
            System.out.println("\n\n==================== FULL DEBUG START ====================");

            // 1️⃣ Officer fetch
            Officer officer = officerRepository.findById(officerId)
                    .orElseThrow(() -> new RuntimeException("Officer not found"));

            System.out.println("✅ Officer Found:");
            System.out.println("   ID: " + officer.getId());
            System.out.println("   Name: " + officer.getFullName());
            System.out.println("   Email: " + officer.getEmail());
            System.out.println("   Department: '" + officer.getDepartment() + "'");

            String officerDepartment = officer.getDepartment();

            // 2️⃣ ALL grievances fetch
            List<Grievance> allGrievances = grievanceRepository.findAll();
            System.out.println("\n📋 ALL Grievances in Database:");
            for (Grievance g : allGrievances) {
                System.out.println("   ID: " + g.getId() +
                        " | Title: " + g.getTitle() +
                        " | Category: '" + g.getCategory() + "'" +
                        " | Department: '" + g.getDepartment() + "'");
            }

            // 3️⃣ Manual filter - case insensitive
            List<Grievance> filteredGrievances = new ArrayList<>();
            for (Grievance g : allGrievances) {
                if (g.getCategory() != null &&
                        g.getCategory().equalsIgnoreCase(officerDepartment)) {
                    filteredGrievances.add(g);
                }
            }

            System.out.println("\n🔍 Filtered Grievances (by Category):");
            System.out.println("   Officer Department: '" + officerDepartment + "'");
            System.out.println("   Total Found: " + filteredGrievances.size());
            for (Grievance g : filteredGrievances) {
                System.out.println("   - ID: " + g.getId() + " | Title: " + g.getTitle() + " | Category: " + g.getCategory());
            }

            System.out.println("\n✅ RETURNING: " + filteredGrievances.size() + " grievances");
            System.out.println("==================== FULL DEBUG END ====================\n\n");

            return ResponseEntity.ok(filteredGrievances);

        } catch (Exception e) {
            System.err.println("❌ ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update grievance status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        try {
            Grievance grievance = grievanceRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Grievance not found"));

            grievance.setStatus(Grievance.Status.valueOf(status));
            grievance.setUpdatedAt(LocalDateTime.now());

            if (status.equals("RESOLVED")) {
                grievance.setResolvedAt(LocalDateTime.now());
            }

            Grievance updated = grievanceRepository.save(grievance);

            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status");
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Assign grievance to specific officer
     * ✅ UPDATED: Check verification status before assignment
     */
    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assignGrievance(
            @PathVariable Long id,
            @RequestParam Long officerId
    ) {
        try {
            Grievance grievance = grievanceRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Grievance not found"));

            // ✅ Check verification status
            if (!"APPROVED".equals(grievance.getVerificationStatus())) {
                return ResponseEntity.badRequest()
                        .body("Cannot assign unverified grievance");
            }

            User officer = userRepository.findById(officerId)
                    .orElseThrow(() -> new RuntimeException("Officer not found"));

            grievance.setAssignedTo(officer);
            grievance.setStatus(Grievance.Status.IN_PROGRESS);
            grievance.setUpdatedAt(LocalDateTime.now());

            Grievance updated = grievanceRepository.save(grievance);
            return ResponseEntity.ok(updated);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete grievance
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGrievance(@PathVariable Long id) {
        try {
            grievanceRepository.deleteById(id);
            return ResponseEntity.ok().body("Grievance deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting grievance: " + e.getMessage());
        }
    }

    /**
     * Helper class for grievance statistics
     */
    static class GrievanceStats {
        public long total;
        public long pending;
        public long resolved;

        public GrievanceStats(long total, long pending, long resolved) {
            this.total = total;
            this.pending = pending;
            this.resolved = resolved;
        }
    }

    /**
     * ✅ Verify grievance endpoint
     */
    @PatchMapping("/{id}/verify")
    public ResponseEntity<?> verifyGrievance(
            @PathVariable Long id,
            @RequestBody VerificationRequest request) {

        try {
            Grievance grievance = grievanceRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Grievance not found"));

            if (request.isApproved()) {
                grievance.setVerificationStatus("APPROVED");
                grievance.setVerificationReason(request.getReason());
            } else {
                grievance.setVerificationStatus("REJECTED");
                grievance.setRejectionReason(request.getReason());
                grievance.setStatus(Grievance.Status.REJECTED);
            }

            grievance.setUpdatedAt(LocalDateTime.now());
            Grievance updated = grievanceRepository.save(grievance);

            return ResponseEntity.ok(updated);

        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    /**
     * ✅ Get pending verification
     */
    @GetMapping("/pending-verification")
    public ResponseEntity<List<Grievance>> getPendingVerification() {
        try {
            List<Grievance> pending = grievanceRepository.findByVerificationStatus("PENDING");
            return ResponseEntity.ok(pending);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ✅ Get grievance image
     */
    @GetMapping("/image/{filename}")
    public ResponseEntity<byte[]> getImage(@PathVariable String filename) {
        try {
            Path imagePath = Paths.get(uploadPath, filename);

            if (!Files.exists(imagePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] imageBytes = Files.readAllBytes(imagePath);

            String contentType = "image/jpeg";
            if (filename.toLowerCase().endsWith(".png")) {
                contentType = "image/png";
            }

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .body(imageBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ✅ Helper class
     */
    static class VerificationRequest {
        private boolean approved;
        private String reason;

        public VerificationRequest() {
        }

        public boolean isApproved() {
            return approved;
        }

        public void setApproved(boolean approved) {
            this.approved = approved;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}