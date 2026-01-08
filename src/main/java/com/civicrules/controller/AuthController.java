package com.civicrules.controller;

import com.civicrules.dto.LoginRequest;
import com.civicrules.dto.RegisterRequest;
import com.civicrules.model.User;
import com.civicrules.model.Citizen;
import com.civicrules.model.Admin;
import com.civicrules.model.Officer;
import com.civicrules.repository.UserRepository;
import com.civicrules.repository.CitizenRepository;
import com.civicrules.repository.AdminRepository;
import com.civicrules.repository.OfficerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CitizenRepository citizenRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private OfficerRepository officerRepository;

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Auth API is working!");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            if (request.getName() == null || request.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Name is required"));
            }

            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Email is required"));
            }

            if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Phone is required"));
            }

            if (request.getPassword() == null || request.getPassword().length() < 6) {
                return ResponseEntity.badRequest().body(createErrorResponse("Password must be at least 6 characters"));
            }

            String roleStr = request.getRole() != null ? request.getRole().toUpperCase() : "CITIZEN";
            User.Role role;

            try {
                role = User.Role.valueOf(roleStr);
            } catch (IllegalArgumentException e) {
                role = User.Role.CITIZEN;
            }

            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body(createErrorResponse("Email already registered"));
            }

            User user = new User();
            user.setName(request.getName());
            user.setFullName(request.getName());
            user.setEmail(request.getEmail());
            user.setPhone(request.getPhone());
            user.setPhoneNumber(request.getPhone());
            user.setPassword(request.getPassword());
            user.setUsername(request.getEmail());
            user.setRole(role);
            user.setActive(true);
            user.setCreatedAt(LocalDateTime.now());

            User savedUser = userRepository.save(user);

            if (role == User.Role.CITIZEN) {
                Citizen citizen = new Citizen();
                citizen.setName(request.getName());
                citizen.setEmail(request.getEmail());
                citizen.setPhoneNumber(request.getPhone());
                citizen.setPassword(request.getPassword());
                citizen.setCreatedAt(LocalDateTime.now());
                citizen.setIsActive(true);
                citizenRepository.save(citizen);

            } else if (role == User.Role.ADMIN) {
                Admin admin = new Admin();
                admin.setFullName(request.getName());
                admin.setEmail(request.getEmail());
                admin.setPhoneNumber(request.getPhone());
                admin.setPassword(request.getPassword());
                admin.setCreatedAt(LocalDateTime.now());
                admin.setIsActive(true);
                adminRepository.save(admin);
            } else if (role == User.Role.OFFICER) {
                Officer officer = new Officer();
                officer.setFullName(request.getName());
                officer.setFirstName(request.getName());
                officer.setLastName("");
                officer.setEmail(request.getEmail());
                officer.setPhoneNumber(request.getPhone());
                officer.setPhone(request.getPhone());
                officer.setPassword(request.getPassword());
                officer.setDepartment("General");
                officer.setCreatedAt(LocalDateTime.now());
                officer.setIsActive(true);
                officerRepository.save(officer);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Registration successful! Please login.");
            response.put("email", savedUser.getEmail());
            response.put("name", savedUser.getFullName());
            response.put("role", savedUser.getRole().toString());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(createErrorResponse("Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            System.out.println("🔍 Login attempt for email: " + request.getEmail());

            Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

            if (!userOptional.isPresent()) {
                System.out.println("❌ User not found in database");
                return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
            }

            User user = userOptional.get();

            System.out.println("🔍 User found: " + user.getEmail());
            System.out.println("🔍 Password from DB: " + (user.getPassword() != null ? "EXISTS (length: " + user.getPassword().length() + ")" : "NULL"));
            System.out.println("🔍 Password from request: " + (request.getPassword() != null ? "EXISTS (length: " + request.getPassword().length() + ")" : "NULL"));

            if (user.getPassword() == null) {
                System.out.println("❌ Password is NULL in database!");
                return ResponseEntity.badRequest().body(Map.of("message", "Account error. Please contact support."));
            }

            if (request.getPassword() == null) {
                System.out.println("❌ No password provided in request!");
                return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
            }

            if (!user.getPassword().equals(request.getPassword())) {
                System.out.println("❌ Password mismatch!");
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid password"));
            }

            if (!user.getIsActive()) {
                System.out.println("❌ Account is deactivated");
                return ResponseEntity.badRequest().body(Map.of("message", "Account is deactivated"));
            }

            System.out.println("✅ Login successful for: " + user.getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("token", "jwt-token-here");
            response.put("user", Map.of(
                    "id", user.getId(),
                    "name", user.getName() != null ? user.getName() : user.getFullName(),
                    "email", user.getEmail(),
                    "phone", user.getPhone() != null ? user.getPhone() : user.getPhoneNumber(),
                    "role", user.getRole().toString()
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.out.println("❌ Login exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Login failed: " + e.getMessage()));
        }
    }

    @GetMapping("/grievances/citizen/{citizenId}")
    public ResponseEntity<?> getCitizenGrievances(@PathVariable Long citizenId) {
        try {
            List<Map<String, Object>> grievances = new ArrayList<>();

            Map<String, Object> report1 = new HashMap<>();
            report1.put("id", 1);
            report1.put("title", "Water Supply Issue");
            report1.put("description", "The area is facing irregular and inadequate water supply, causing inconvenience to residents. Immediate attention is required.");
            report1.put("status", "PENDING");
            report1.put("category", "Water");
            report1.put("createdAt", "2025-12-26T16:44:24");
            grievances.add(report1);

            Map<String, Object> report2 = new HashMap<>();
            report2.put("id", 2);
            report2.put("title", "Road Maintenance Required");
            report2.put("description", "The roads are damaged and poorly maintained, causing inconvenience and safety risks for commuters. Immediate repair and improvement are required.");
            report2.put("status", "IN_PROGRESS");
            report2.put("category", "Road");
            report2.put("createdAt", "2025-12-26T17:02:33");
            grievances.add(report2);

            return ResponseEntity.ok(grievances);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to load grievances"));
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("message", message);
        return errorResponse;
    }
}