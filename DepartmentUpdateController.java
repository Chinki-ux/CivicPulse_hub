package com.civicrules.controller;

import com.civicrules.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class DepartmentUpdateController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * 🔧 DIRECT SQL UPDATE - Bypasses JPA
     * URL: http://localhost:8080/api/admin/update-departments-sql
     */
    @GetMapping("/update-departments-sql")
    public ResponseEntity<?> updateDepartmentsDirect() {
        Map<String, Object> result = new HashMap<>();

        try {
            System.out.println("\n================================");
            System.out.println("🔧 DIRECT SQL UPDATE");
            System.out.println("================================\n");

            // Direct SQL updates - TABLE NAME IS "users" NOT "user"
            int r1 = jdbcTemplate.update("UPDATE users SET department = 'Road' WHERE id = 33");
            System.out.println("✅ Officer 33 -> Road (" + r1 + " rows)");

            int r2 = jdbcTemplate.update("UPDATE users SET department = 'Water' WHERE id = 46");
            System.out.println("✅ Officer 46 -> Water (" + r2 + " rows)");

            int r3 = jdbcTemplate.update("UPDATE users SET department = 'Electricity' WHERE id = 47");
            System.out.println("✅ Officer 47 -> Electricity (" + r3 + " rows)");

            int r4 = jdbcTemplate.update("UPDATE users SET department = 'Sanitation' WHERE id = 48");
            System.out.println("✅ Officer 48 -> Sanitation (" + r4 + " rows)");

            int r5 = jdbcTemplate.update("UPDATE users SET department = 'Street Light' WHERE id = 49");
            System.out.println("✅ Officer 49 -> Street Light (" + r5 + " rows)");

            int totalUpdated = r1 + r2 + r3 + r4 + r5;

            System.out.println("\n================================");
            System.out.println("🎉 UPDATED: " + totalUpdated + " officers");
            System.out.println("================================\n");

            result.put("status", "success");
            result.put("message", "Departments updated via direct SQL!");
            result.put("totalUpdated", totalUpdated);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("❌ ERROR: " + e.getMessage());
            e.printStackTrace();

            result.put("status", "error");
            result.put("message", e.getMessage());

            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * 📊 Check departments with direct SQL
     * URL: http://localhost:8080/api/admin/check-departments-sql
     */
    @GetMapping("/check-departments-sql")
    public ResponseEntity<?> checkDepartmentsDirect() {
        Map<String, Object> result = new HashMap<>();

        try {
            String sql = "SELECT id, name, email, department, role FROM users WHERE id IN (33, 46, 47, 48, 49)";

            var officers = jdbcTemplate.queryForList(sql);

            result.put("status", "success");
            result.put("officers", officers);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * 🔍 Check if department column exists
     * URL: http://localhost:8080/api/admin/check-column
     */
    @GetMapping("/check-column")
    public ResponseEntity<?> checkDepartmentColumn() {
        Map<String, Object> result = new HashMap<>();

        try {
            String sql = "SHOW COLUMNS FROM users LIKE 'department'";
            var columns = jdbcTemplate.queryForList(sql);

            result.put("status", "success");
            result.put("columnExists", !columns.isEmpty());
            result.put("columnInfo", columns);

            if (columns.isEmpty()) {
                result.put("message", "⚠️ DEPARTMENT COLUMN DOES NOT EXIST!");
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
}