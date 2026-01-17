package com.civicrules.service;

import com.civicrules.dto.AnalyticsDTO.*;
import com.civicrules.model.Grievance;
import com.civicrules.repository.GrievanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private GrievanceRepository grievanceRepository;

    // SLA targets for different categories (in days)
    private static final Map<String, Integer> SLA_TARGETS = Map.of(
            "Road", 3,
            "Water", 2,
            "Electricity", 2,
            "Sanitation", 3,
            "Street Light", 1,
            "Other", 5
    );

    /**
     * Get complete dashboard statistics
     */
    public DashboardStats getDashboardStats() {
        List<Grievance> allGrievances = grievanceRepository.findAll();

        DashboardStats stats = new DashboardStats();

        // Basic counts
        stats.setTotalComplaints((long) allGrievances.size());
        stats.setResolvedComplaints(
                allGrievances.stream()
                        .filter(g -> g.getStatus() == Grievance.Status.RESOLVED)
                        .count()
        );
        stats.setPendingComplaints(
                allGrievances.stream()
                        .filter(g -> g.getStatus() == Grievance.Status.PENDING)
                        .count()
        );
        stats.setInProgressComplaints(
                allGrievances.stream()
                        .filter(g -> g.getStatus() == Grievance.Status.IN_PROGRESS)
                        .count()
        );

        // Resolution rate
        if (stats.getTotalComplaints() > 0) {
            stats.setResolutionRate(
                    (stats.getResolvedComplaints() * 100.0) / stats.getTotalComplaints()
            );
        } else {
            stats.setResolutionRate(0.0);
        }

        // Average resolution time
        stats.setAverageResolutionTime(calculateAverageResolutionTime(allGrievances));

        // Category distribution
        stats.setCategoryDistribution(getCategoryDistribution());

        // Zone distribution
        stats.setZoneDistribution(getZoneDistribution());

        // SLA Performance
        stats.setSlaPerformance(getSLAPerformance());

        // Red zones
        stats.setRedZones(getRedZones());

        return stats;
    }

    /**
     * Get category-wise complaint distribution
     */
    public List<CategoryDistribution> getCategoryDistribution() {
        List<Grievance> allGrievances = grievanceRepository.findAll();
        long total = allGrievances.size();

        Map<String, Long> categoryCount = allGrievances.stream()
                .collect(Collectors.groupingBy(
                        Grievance::getCategory,
                        Collectors.counting()
                ));

        return categoryCount.entrySet().stream()
                .map(entry -> {
                    CategoryDistribution cd = new CategoryDistribution(entry.getKey(), entry.getValue());
                    if (total > 0) {
                        cd.setPercentage((entry.getValue() * 100.0) / total);
                    } else {
                        cd.setPercentage(0.0);
                    }
                    return cd;
                })
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * Get zone-wise complaint distribution
     */
    public List<ZoneDistribution> getZoneDistribution() {
        List<Grievance> allGrievances = grievanceRepository.findAll();

        Map<String, Long> zoneCount = allGrievances.stream()
                .collect(Collectors.groupingBy(
                        Grievance::getLocation,
                        Collectors.counting()
                ));

        return zoneCount.entrySet().stream()
                .map(entry -> new ZoneDistribution(entry.getKey(), entry.getValue()))
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .collect(Collectors.toList());
    }

    /**
     * Get SLA performance analysis
     */
    public List<SLAPerformance> getSLAPerformance() {
        List<Grievance> allGrievances = grievanceRepository.findAll();

        Map<String, List<Grievance>> categoryGroups = allGrievances.stream()
                .collect(Collectors.groupingBy(Grievance::getCategory));

        List<SLAPerformance> slaList = new ArrayList<>();

        for (Map.Entry<String, List<Grievance>> entry : categoryGroups.entrySet()) {
            String category = entry.getKey();
            List<Grievance> grievances = entry.getValue();

            SLAPerformance sla = new SLAPerformance();
            sla.setCategory(category);
            sla.setSlaTargetDays(SLA_TARGETS.getOrDefault(category, 5));
            sla.setTotalComplaints((long) grievances.size());

            // Calculate resolved grievances
            List<Grievance> resolvedGrievances = grievances.stream()
                    .filter(g -> g.getStatus() == Grievance.Status.RESOLVED && g.getResolvedAt() != null)
                    .collect(Collectors.toList());

            if (!resolvedGrievances.isEmpty()) {
                // Count SLA compliance
                long withinSLA = resolvedGrievances.stream()
                        .filter(g -> {
                            long daysTaken = ChronoUnit.DAYS.between(
                                    g.getCreatedAt(),
                                    g.getResolvedAt()
                            );
                            return daysTaken <= sla.getSlaTargetDays();
                        })
                        .count();

                sla.setWithinSLA(withinSLA);
                sla.setBreachedSLA(resolvedGrievances.size() - withinSLA);

                // Compliance rate
                sla.setComplianceRate((withinSLA * 100.0) / resolvedGrievances.size());

                // Average resolution time
                double avgDays = resolvedGrievances.stream()
                        .mapToDouble(g -> ChronoUnit.DAYS.between(
                                g.getCreatedAt(),
                                g.getResolvedAt()
                        ))
                        .average()
                        .orElse(0.0);

                sla.setAverageResolutionDays(avgDays);
            } else {
                sla.setWithinSLA(0L);
                sla.setBreachedSLA(0L);
                sla.setComplianceRate(0.0);
                sla.setAverageResolutionDays(0.0);
            }

            slaList.add(sla);
        }

        return slaList.stream()
                .sorted((a, b) -> Double.compare(b.getComplianceRate(), a.getComplianceRate()))
                .collect(Collectors.toList());
    }

    /**
     * Identify red zones (complaint-prone areas)
     */
    public List<RedZone> getRedZones() {
        List<Grievance> allGrievances = grievanceRepository.findAll();

        Map<String, List<Grievance>> locationGroups = allGrievances.stream()
                .collect(Collectors.groupingBy(Grievance::getLocation));

        List<RedZone> redZones = new ArrayList<>();

        for (Map.Entry<String, List<Grievance>> entry : locationGroups.entrySet()) {
            String location = entry.getKey();
            List<Grievance> grievances = entry.getValue();
            long count = grievances.size();

            // Only consider areas with 3+ complaints as potential red zones
            if (count >= 3) {
                RedZone zone = new RedZone();
                zone.setLocation(location);
                zone.setComplaintCount(count);

                // Get first grievance coordinates
                if (!grievances.isEmpty() && grievances.get(0).getLatitude() != null) {
                    zone.setLatitude(grievances.get(0).getLatitude());
                    zone.setLongitude(grievances.get(0).getLongitude());
                }

                // Find most common category
                Map<String, Long> categoryCount = grievances.stream()
                        .collect(Collectors.groupingBy(
                                Grievance::getCategory,
                                Collectors.counting()
                        ));

                String mostCommon = categoryCount.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse("Unknown");

                zone.setMostCommonCategory(mostCommon);

                // Determine risk level
                if (count >= 10) {
                    zone.setRiskLevel("HIGH");
                } else if (count >= 5) {
                    zone.setRiskLevel("MEDIUM");
                } else {
                    zone.setRiskLevel("LOW");
                }

                redZones.add(zone);
            }
        }

        return redZones.stream()
                .sorted((a, b) -> Long.compare(b.getComplaintCount(), a.getComplaintCount()))
                .limit(10) // Top 10 red zones
                .collect(Collectors.toList());
    }

    /**
     * Calculate average resolution time in days
     */
    private Double calculateAverageResolutionTime(List<Grievance> grievances) {
        List<Grievance> resolved = grievances.stream()
                .filter(g -> g.getStatus() == Grievance.Status.RESOLVED && g.getResolvedAt() != null)
                .collect(Collectors.toList());

        if (resolved.isEmpty()) {
            return 0.0;
        }

        return resolved.stream()
                .mapToDouble(g -> ChronoUnit.DAYS.between(g.getCreatedAt(), g.getResolvedAt()))
                .average()
                .orElse(0.0);
    }
}