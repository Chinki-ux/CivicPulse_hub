// ========================================
// CivicPulse Hub - Analytics Dashboard JS
// With Chart.js Integration
// ========================================

const API_URL = 'http://localhost:8080/api';

// Global data storage
let dashboardData = null;
let charts = {};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Analytics Dashboard Loading...');
    
    setupNavigation();
    loadAllAnalytics();
    
    console.log('✅ Analytics Dashboard Initialized!');
});

// ========================================
// NAVIGATION
// ========================================
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionName = this.getAttribute('data-section');
            
            if (sectionName) {
                switchSection(sectionName);
                
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

function switchSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log(`📍 Switched to: ${sectionName}`);
    }
}

// ========================================
// LOAD ALL ANALYTICS DATA
// ========================================
async function loadAllAnalytics() {
    const token = localStorage.getItem('token');
    
    try {
        console.log('📥 Loading analytics data...');
        
        const response = await fetch(`${API_URL}/analytics/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load analytics');
        }
        
        dashboardData = await response.json();
        console.log('✅ Analytics data loaded:', dashboardData);
        
        // Update all sections
        updateOverviewSection();
        updateCategorySection();
        updateZonesSection();
        updateSLASection();
        updateRedZonesSection();
        
    } catch (error) {
        console.error('❌ Error loading analytics:', error);
        alert('Failed to load analytics data. Please try again.');
    }
}

// ========================================
// OVERVIEW SECTION
// ========================================
function updateOverviewSection() {
    if (!dashboardData) return;
    
    // Update stat cards
    document.getElementById('totalComplaints').textContent = dashboardData.totalComplaints || 0;
    document.getElementById('resolvedComplaints').textContent = dashboardData.resolvedComplaints || 0;
    document.getElementById('inProgressComplaints').textContent = dashboardData.inProgressComplaints || 0;
    document.getElementById('pendingComplaints').textContent = dashboardData.pendingComplaints || 0;
    
    // Update metrics
    document.getElementById('resolutionRate').textContent = 
        (dashboardData.resolutionRate || 0).toFixed(1) + '%';
    document.getElementById('avgResolutionTime').textContent = 
        (dashboardData.averageResolutionTime || 0).toFixed(1) + ' days';
    
    // Create quick charts
    createQuickCategoryChart();
    createQuickSLAChart();
}

function createQuickCategoryChart() {
    const ctx = document.getElementById('quickCategoryChart');
    if (!ctx || !dashboardData.categoryDistribution) return;
    
    if (charts.quickCategory) {
        charts.quickCategory.destroy();
    }
    
    const categories = dashboardData.categoryDistribution.map(c => c.category);
    const counts = dashboardData.categoryDistribution.map(c => c.count);
    
    charts.quickCategory = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: counts,
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6',
                    '#06b6d4'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function createQuickSLAChart() {
    const ctx = document.getElementById('quickSLAChart');
    if (!ctx || !dashboardData.slaPerformance) return;
    
    if (charts.quickSLA) {
        charts.quickSLA.destroy();
    }
    
    const categories = dashboardData.slaPerformance.map(s => s.category);
    const compliance = dashboardData.slaPerformance.map(s => s.complianceRate || 0);
    
    charts.quickSLA = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'SLA Compliance %',
                data: compliance,
                backgroundColor: compliance.map(c => c >= 80 ? '#10b981' : c >= 60 ? '#f59e0b' : '#ef4444'),
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ========================================
// CATEGORY SECTION
// ========================================
function updateCategorySection() {
    if (!dashboardData || !dashboardData.categoryDistribution) return;
    
    createCategoryPieChart();
    createCategoryBarChart();
    updateCategoryTable();
}

function createCategoryPieChart() {
    const ctx = document.getElementById('categoryPieChart');
    if (!ctx) return;
    
    if (charts.categoryPie) {
        charts.categoryPie.destroy();
    }
    
    const categories = dashboardData.categoryDistribution.map(c => c.category);
    const counts = dashboardData.categoryDistribution.map(c => c.count);
    
    charts.categoryPie = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: counts,
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6',
                    '#06b6d4',
                    '#f97316'
                ],
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        font: { size: 14 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function createCategoryBarChart() {
    const ctx = document.getElementById('categoryBarChart');
    if (!ctx) return;
    
    if (charts.categoryBar) {
        charts.categoryBar.destroy();
    }
    
    const categories = dashboardData.categoryDistribution.map(c => c.category);
    const counts = dashboardData.categoryDistribution.map(c => c.count);
    
    charts.categoryBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Number of Complaints',
                data: counts,
                backgroundColor: '#3b82f6',
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function updateCategoryTable() {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = dashboardData.categoryDistribution.map(cat => `
        <tr>
            <td><strong>${cat.category}</strong></td>
            <td>${cat.count}</td>
            <td>${cat.percentage.toFixed(1)}%</td>
            <td><span class="trend-up">↑</span></td>
        </tr>
    `).join('');
}

// ========================================
// ZONES SECTION
// ========================================
function updateZonesSection() {
    if (!dashboardData || !dashboardData.zoneDistribution) return;
    
    createZoneBarChart();
    updateZoneTable();
}

function createZoneBarChart() {
    const ctx = document.getElementById('zoneBarChart');
    if (!ctx) return;
    
    if (charts.zoneBar) {
        charts.zoneBar.destroy();
    }
    
    // Get top 15 zones
    const topZones = dashboardData.zoneDistribution.slice(0, 15);
    const zones = topZones.map(z => z.zone);
    const counts = topZones.map(z => z.count);
    
    // Color gradient based on count
    const maxCount = Math.max(...counts);
    const colors = counts.map(count => {
        const intensity = (count / maxCount);
        if (intensity > 0.7) return '#ef4444'; // High - Red
        if (intensity > 0.4) return '#f59e0b'; // Medium - Orange
        return '#10b981'; // Low - Green
    });
    
    charts.zoneBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: zones,
            datasets: [{
                label: 'Complaint Count',
                data: counts,
                backgroundColor: colors,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                },
                y: {
                    ticks: {
                        font: { size: 12 }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Heat Map: Top Complaint Zones',
                    font: { size: 16, weight: 'bold' }
                }
            }
        }
    });
}

function updateZoneTable() {
    const tbody = document.getElementById('zoneTableBody');
    if (!tbody) return;
    
    const topZones = dashboardData.zoneDistribution.slice(0, 20);
    
    tbody.innerHTML = topZones.map(zone => {
        let heatLevel, badgeClass;
        if (zone.count >= 10) {
            heatLevel = 'HIGH';
            badgeClass = 'badge-high';
        } else if (zone.count >= 5) {
            heatLevel = 'MEDIUM';
            badgeClass = 'badge-medium';
        } else {
            heatLevel = 'LOW';
            badgeClass = 'badge-low';
        }
        
        return `
            <tr>
                <td><strong>${zone.zone}</strong></td>
                <td>${zone.count}</td>
                <td><span class="badge ${badgeClass}">${heatLevel}</span></td>
            </tr>
        `;
    }).join('');
}

// ========================================
// SLA SECTION
// ========================================
function updateSLASection() {
    if (!dashboardData || !dashboardData.slaPerformance) return;
    
    createSLAComplianceChart();
    createSLAResolutionChart();
    updateSLATable();
}

function createSLAComplianceChart() {
    const ctx = document.getElementById('slaComplianceChart');
    if (!ctx) return;
    
    if (charts.slaCompliance) {
        charts.slaCompliance.destroy();
    }
    
    const categories = dashboardData.slaPerformance.map(s => s.category);
    const compliance = dashboardData.slaPerformance.map(s => s.complianceRate || 0);
    
    charts.slaCompliance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Compliance Rate (%)',
                data: compliance,
                backgroundColor: compliance.map(c => {
                    if (c >= 80) return '#10b981';
                    if (c >= 60) return '#f59e0b';
                    return '#ef4444';
                }),
                borderRadius: 8,
                barThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Compliance: ${context.parsed.y.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
}

function createSLAResolutionChart() {
    const ctx = document.getElementById('slaResolutionChart');
    if (!ctx) return;
    
    if (charts.slaResolution) {
        charts.slaResolution.destroy();
    }
    
    const categories = dashboardData.slaPerformance.map(s => s.category);
    const avgDays = dashboardData.slaPerformance.map(s => s.averageResolutionDays || 0);
    const targetDays = dashboardData.slaPerformance.map(s => s.slaTargetDays || 0);
    
    charts.slaResolution = new Chart(ctx, {
        type: 'line',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Actual Avg Resolution Time',
                    data: avgDays,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true
                },
                {
                    label: 'SLA Target',
                    data: targetDays,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    borderDash: [5, 5],
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Days'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function updateSLATable() {
    const tbody = document.getElementById('slaTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = dashboardData.slaPerformance.map(sla => {
        const complianceClass = sla.complianceRate >= 80 ? 'badge-success' : 
                               sla.complianceRate >= 60 ? 'badge-warning' : 'badge-danger';
        
        return `
            <tr>
                <td><strong>${sla.category}</strong></td>
                <td>${sla.slaTargetDays} days</td>
                <td>${sla.totalComplaints}</td>
                <td>${sla.withinSLA}</td>
                <td>${sla.breachedSLA}</td>
                <td>${sla.averageResolutionDays.toFixed(1)}</td>
                <td><span class="badge ${complianceClass}">${sla.complianceRate.toFixed(1)}%</span></td>
            </tr>
        `;
    }).join('');
}

// ========================================
// RED ZONES SECTION
// ========================================
function updateRedZonesSection() {
    if (!dashboardData || !dashboardData.redZones) return;
    
    createRedZonesGrid();
    createRedZonesChart();
}

function createRedZonesGrid() {
    const grid = document.getElementById('redZonesGrid');
    if (!grid) return;
    
    if (dashboardData.redZones.length === 0) {
        grid.innerHTML = '<div class="empty-state">✅ No red zones identified!</div>';
        return;
    }
    
    grid.innerHTML = dashboardData.redZones.map(zone => `
        <div class="red-zone-card">
            <div class="red-zone-header">
                <div class="red-zone-location">📍 ${zone.location}</div>
                <span class="badge badge-${zone.riskLevel.toLowerCase()}">${zone.riskLevel}</span>
            </div>
            <div class="red-zone-details">
                <div class="detail-row">
                    <span class="detail-label">Total Complaints:</span>
                    <span class="detail-value">${zone.complaintCount}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Main Issue:</span>
                    <span class="detail-value">${zone.mostCommonCategory}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function createRedZonesChart() {
    const ctx = document.getElementById('redZonesChart');
    if (!ctx) return;
    
    if (charts.redZones) {
        charts.redZones.destroy();
    }
    
    const locations = dashboardData.redZones.map(z => z.location);
    const counts = dashboardData.redZones.map(z => z.complaintCount);
    
    charts.redZones = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: locations,
            datasets: [{
                label: 'Complaint Count',
                data: counts,
                backgroundColor: '#ef4444',
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

console.log('✅ Analytics Dashboard Script Loaded with Chart.js!');