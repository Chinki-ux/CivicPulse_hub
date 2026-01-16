package com.civicrules.dto;

import java.util.List;
import java.util.Map;

/**
 * Analytics Data Transfer Objects
 */
public class AnalyticsDTO {

    /**
     * Category-wise complaint distribution
     */
    public static class CategoryDistribution {
        private String category;
        private Long count;
        private Double percentage;

        public CategoryDistribution() {}

        public CategoryDistribution(String category, Long count) {
            this.category = category;
            this.count = count;
        }

        // Getters and Setters
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public Long getCount() { return count; }
        public void setCount(Long count) { this.count = count; }

        public Double getPercentage() { return percentage; }
        public void setPercentage(Double percentage) { this.percentage = percentage; }
    }

    /**
     * Zone-wise complaint distribution
     */
    public static class ZoneDistribution {
        private String zone;
        private Long count;
        private Double latitude;
        private Double longitude;

        public ZoneDistribution() {}

        public ZoneDistribution(String zone, Long count) {
            this.zone = zone;
            this.count = count;
        }

        // Getters and Setters
        public String getZone() { return zone; }
        public void setZone(String zone) { this.zone = zone; }

        public Long getCount() { return count; }
        public void setCount(Long count) { this.count = count; }

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }
    }

    /**
     * SLA Performance tracking
     */
    public static class SLAPerformance {
        private String category;
        private Integer slaTargetDays;
        private Long totalComplaints;
        private Long withinSLA;
        private Long breachedSLA;
        private Double averageResolutionDays;
        private Double complianceRate;

        public SLAPerformance() {}

        // Getters and Setters
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public Integer getSlaTargetDays() { return slaTargetDays; }
        public void setSlaTargetDays(Integer slaTargetDays) { this.slaTargetDays = slaTargetDays; }

        public Long getTotalComplaints() { return totalComplaints; }
        public void setTotalComplaints(Long totalComplaints) { this.totalComplaints = totalComplaints; }

        public Long getWithinSLA() { return withinSLA; }
        public void setWithinSLA(Long withinSLA) { this.withinSLA = withinSLA; }

        public Long getBreachedSLA() { return breachedSLA; }
        public void setBreachedSLA(Long breachedSLA) { this.breachedSLA = breachedSLA; }

        public Double getAverageResolutionDays() { return averageResolutionDays; }
        public void setAverageResolutionDays(Double averageResolutionDays) {
            this.averageResolutionDays = averageResolutionDays;
        }

        public Double getComplianceRate() { return complianceRate; }
        public void setComplianceRate(Double complianceRate) {
            this.complianceRate = complianceRate;
        }
    }

    /**
     * Red Zone (High-risk areas)
     */
    public static class RedZone {
        private String location;
        private Long complaintCount;
        private Double latitude;
        private Double longitude;
        private String mostCommonCategory;
        private String riskLevel; // HIGH, MEDIUM, LOW

        public RedZone() {}

        // Getters and Setters
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public Long getComplaintCount() { return complaintCount; }
        public void setComplaintCount(Long complaintCount) {
            this.complaintCount = complaintCount;
        }

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }

        public String getMostCommonCategory() { return mostCommonCategory; }
        public void setMostCommonCategory(String mostCommonCategory) {
            this.mostCommonCategory = mostCommonCategory;
        }

        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    }

    /**
     * Overall Dashboard Statistics
     */
    public static class DashboardStats {
        private Long totalComplaints;
        private Long resolvedComplaints;
        private Long pendingComplaints;
        private Long inProgressComplaints;
        private Double resolutionRate;
        private Double averageResolutionTime;
        private List<CategoryDistribution> categoryDistribution;
        private List<ZoneDistribution> zoneDistribution;
        private List<SLAPerformance> slaPerformance;
        private List<RedZone> redZones;

        public DashboardStats() {}

        // Getters and Setters
        public Long getTotalComplaints() { return totalComplaints; }
        public void setTotalComplaints(Long totalComplaints) {
            this.totalComplaints = totalComplaints;
        }

        public Long getResolvedComplaints() { return resolvedComplaints; }
        public void setResolvedComplaints(Long resolvedComplaints) {
            this.resolvedComplaints = resolvedComplaints;
        }

        public Long getPendingComplaints() { return pendingComplaints; }
        public void setPendingComplaints(Long pendingComplaints) {
            this.pendingComplaints = pendingComplaints;
        }

        public Long getInProgressComplaints() { return inProgressComplaints; }
        public void setInProgressComplaints(Long inProgressComplaints) {
            this.inProgressComplaints = inProgressComplaints;
        }

        public Double getResolutionRate() { return resolutionRate; }
        public void setResolutionRate(Double resolutionRate) {
            this.resolutionRate = resolutionRate;
        }

        public Double getAverageResolutionTime() { return averageResolutionTime; }
        public void setAverageResolutionTime(Double averageResolutionTime) {
            this.averageResolutionTime = averageResolutionTime;
        }

        public List<CategoryDistribution> getCategoryDistribution() {
            return categoryDistribution;
        }
        public void setCategoryDistribution(List<CategoryDistribution> categoryDistribution) {
            this.categoryDistribution = categoryDistribution;
        }

        public List<ZoneDistribution> getZoneDistribution() { return zoneDistribution; }
        public void setZoneDistribution(List<ZoneDistribution> zoneDistribution) {
            this.zoneDistribution = zoneDistribution;
        }

        public List<SLAPerformance> getSlaPerformance() { return slaPerformance; }
        public void setSlaPerformance(List<SLAPerformance> slaPerformance) {
            this.slaPerformance = slaPerformance;
        }

        public List<RedZone> getRedZones() { return redZones; }
        public void setRedZones(List<RedZone> redZones) { this.redZones = redZones; }
    }
}