package com.civicrules.controller;

import com.civicrules.dto.AnalyticsDTO.*;
import com.civicrules.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    /**
     * Get complete dashboard statistics
     * Endpoint: GET /api/analytics/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStats> getDashboardStats() {
        try {
            DashboardStats stats = analyticsService.getDashboardStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    /**
     * Get category-wise complaint distribution
     * Endpoint: GET /api/analytics/category-distribution
     */
    @GetMapping("/category-distribution")
    public ResponseEntity<List<CategoryDistribution>> getCategoryDistribution() {
        try {
            List<CategoryDistribution> distribution = analyticsService.getCategoryDistribution();
            return ResponseEntity.ok(distribution);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get zone-wise complaint distribution
     * Endpoint: GET /api/analytics/zone-distribution
     */
    @GetMapping("/zone-distribution")
    public ResponseEntity<List<ZoneDistribution>> getZoneDistribution() {
        try {
            List<ZoneDistribution> distribution = analyticsService.getZoneDistribution();
            return ResponseEntity.ok(distribution);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get SLA performance analysis
     * Endpoint: GET /api/analytics/sla-performance
     */
    @GetMapping("/sla-performance")
    public ResponseEntity<List<SLAPerformance>> getSLAPerformance() {
        try {
            List<SLAPerformance> performance = analyticsService.getSLAPerformance();
            return ResponseEntity.ok(performance);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get red zones (high-risk complaint areas)
     * Endpoint: GET /api/analytics/red-zones
     */
    @GetMapping("/red-zones")
    public ResponseEntity<List<RedZone>> getRedZones() {
        try {
            List<RedZone> redZones = analyticsService.getRedZones();
            return ResponseEntity.ok(redZones);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}