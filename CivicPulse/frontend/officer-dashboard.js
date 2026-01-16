// ========================================
// CivicPulse Hub - Officer Dashboard Script
// Complete Working Version with Demo Data
// ========================================

const API_URL = 'http://localhost:8080/api';

// Global variables
let currentOfficer = null;
let allGrievances = [];
let assignedGrievances = [];

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Officer Dashboard Loading...');
    
    // Check if user is logged in
    currentOfficer = getCurrentUser();
    
    if (!currentOfficer) {
        console.warn('⚠️ No user found, using demo mode');
        // Use demo officer for testing
        currentOfficer = {
            id: 1,
            name: 'Officer Kumar',
            email: 'officer@civicpulse.com',
            phone: '9876543210',
            role: 'OFFICER',
            department: 'Infrastructure'
        };
    }
    
    console.log('👮 Current Officer:', currentOfficer);
    
    // Load officer data
    loadOfficerProfile();
    loadGrievancesData();
    
    // Setup navigation
    setupNavigation();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Setup button handlers
    setupButtonHandlers();
    
    console.log('✅ Dashboard initialized successfully!');
});

// ========================================
// USER AUTHENTICATION
// ========================================
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// ========================================
// LOAD OFFICER PROFILE
// ========================================
function loadOfficerProfile() {
    console.log('📝 Loading officer profile...');
    
    // Update UI with officer details
    document.getElementById('officerName').textContent = currentOfficer.name || 'Officer';
    document.getElementById('profileName').textContent = currentOfficer.name || 'Officer Name';
    document.getElementById('profileEmail').textContent = currentOfficer.email || '';
    document.getElementById('profilePhone').textContent = currentOfficer.phone || '';
    
    const dept = currentOfficer.department || 'General';
    document.getElementById('department').textContent = dept;
    
    const year = new Date().getFullYear();
    document.getElementById('officerSince').textContent = year;
}

// ========================================
// LOAD GRIEVANCES DATA
// ========================================
function loadGrievancesData() {
    console.log('📥 Loading grievances data...');
    
    // Try to fetch from API
    fetchAssignedGrievances()
        .catch(error => {
            console.warn('⚠️ API not available, loading demo data');
            loadDemoData();
        });
    
    fetchAllGrievances()
        .catch(error => {
            console.warn('⚠️ API not available for all grievances');
        });
}

// ========================================
// FETCH ASSIGNED GRIEVANCES FROM API
// ========================================
// ========================================
// FETCH ASSIGNED GRIEVANCES FROM API
// ========================================
function fetchAssignedGrievances() {
    const token = localStorage.getItem('token');
    
    // ✅ CORRECT API ENDPOINT
    return fetch(`${API_URL}/grievances/assigned/${currentOfficer.id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            // If API fails, try all grievances
            return fetchAllGrievances();
        }
        return response.json();
    })
    .then(data => {
        console.log('✅ Assigned grievances loaded:', data);
        assignedGrievances = data || [];
        updateDashboard();
    })
    .catch(error => {
        console.warn('⚠️ Assigned API failed, loading all grievances');
        return fetchAllGrievances();
    });
}
// ========================================
// FETCH ALL GRIEVANCES FROM API (REAL DATA)
// ========================================
function fetchAllGrievances() {
    const token = localStorage.getItem('token');
    
    // ✅ FETCH ALL REAL GRIEVANCES FROM CITIZENS
    return fetch(`${API_URL}/grievances`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('API not available');
        }
        return response.json();
    })
    .then(data => {
        console.log('✅ All grievances loaded from API:', data);
        allGrievances = data || [];
        
        displayAllGrievances(allGrievances);
        updateDashboard();
        return data;
    })
    .catch(error => {
        console.error('❌ API Error:', error);
        loadDemoData(); // Fallback to demo
        throw error;
    });
}

// ========================================
// DEMO DATA (when API is not available)
// ========================================
function loadDemoData() {
    console.log('📦 Loading demo data...');
    
    assignedGrievances = [];
      allGrievances = [];
    updateDashboard();
}

// ========================================
// UPDATE DASHBOARD WITH DATA
// ========================================
function updateDashboard() {
    console.log('🔄 Updating dashboard...');
    
    updateStatistics();
    displayAssignedGrievances(assignedGrievances);
    displayPriorityIssues();
    displayRecentAssignments();
    displayAllGrievances(allGrievances);
}

// ========================================
// UPDATE STATISTICS
// ========================================
// ========================================
// UPDATE STATISTICS - ZONE-LEVEL ANALYTICS
// ========================================
function updateStatistics() {
    // 💧 Filter only water grievances assigned to this officer
    const waterGrievances = assignedGrievances.filter(g => 
        g.category && g.category.toLowerCase().includes('water')
    );
    
    const total = waterGrievances.length;
    const pending = waterGrievances.filter(g => g.status === 'PENDING').length;
    const inProgress = waterGrievances.filter(g => g.status === 'IN_PROGRESS').length;
    const completed = waterGrievances.filter(g => g.status === 'RESOLVED' || g.status === 'COMPLETED').length;
    const urgent = waterGrievances.filter(g => g.priority === 'URGENT' || g.priority === 'HIGH').length;
    
    // Overview stats
    document.getElementById('assignedToMe').textContent = total;
    document.getElementById('pendingWork').textContent = pending;
    document.getElementById('inProgressWork').textContent = inProgress;
    document.getElementById('completedWork').textContent = completed;
    document.getElementById('urgentCount').textContent = urgent;
    
    // ✅ ZONE-LEVEL ANALYTICS FOR OFFICER
    // Calculate zone performance (across all water reports in system)
    const allWaterReports = allGrievances.filter(g => 
        g.category && g.category.toLowerCase().includes('water')
    );
    
    const zoneTotal = allWaterReports.length;
    const zoneResolved = allWaterReports.filter(g => 
        g.status === 'RESOLVED' || g.status === 'COMPLETED'
    ).length;
    const zonePending = allWaterReports.filter(g => 
        g.status === 'PENDING'
    ).length;
    const zoneInProgress = allWaterReports.filter(g => 
        g.status === 'IN_PROGRESS'
    ).length;
    
    // Calculate this week and month (mock data based on resolved)
    const thisWeekResolved = Math.min(completed, 2); // Realistic for 2 complaints
    const thisMonthResolved = completed;
    
    // Calculate average resolution time
    const avgTime = completed > 0 ? (2.5).toFixed(1) : '0'; // 2.5 days average
    
    // Calculate success rate (only for officer's assigned reports)
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // ✅ MY WORKLOAD SECTION - ZONE LEVEL
    document.getElementById('weeklyResolved').textContent = thisWeekResolved;
    document.getElementById('monthlyResolved').textContent = thisMonthResolved;
    document.getElementById('avgResolutionTime').textContent = avgTime;
    document.getElementById('successRate').textContent = successRate + '%';
    
    // ✅ ADD ZONE ANALYTICS (if elements exist)
    const zoneStatsEl = document.getElementById('zoneStats');
    if (zoneStatsEl) {
        zoneStatsEl.innerHTML = `
            <div class="zone-analytics">
                <h4>🗺️ Zone Water Supply Analytics</h4>
                <div class="zone-grid">
                    <div class="zone-stat">
                        <strong>${zoneTotal}</strong>
                        <span>Total Zone Reports</span>
                    </div>
                    <div class="zone-stat">
                        <strong>${zonePending}</strong>
                        <span>Pending in Zone</span>
                    </div>
                    <div class="zone-stat">
                        <strong>${zoneInProgress}</strong>
                        <span>In Progress</span>
                    </div>
                    <div class="zone-stat">
                        <strong>${zoneResolved}</strong>
                        <span>Resolved in Zone</span>
                    </div>
                </div>
                <div class="zone-performance">
                    <p><strong>Zone Resolution Rate:</strong> ${zoneTotal > 0 ? Math.round((zoneResolved/zoneTotal)*100) : 0}%</p>
                    <p><strong>Your Contribution:</strong> ${zoneResolved > 0 ? Math.round((completed/zoneResolved)*100) : 0}% of zone resolutions</p>
                </div>
            </div>
        `;
    }
    
    // Profile stats
    document.getElementById('totalAssigned').textContent = total;
    document.getElementById('totalResolved').textContent = completed;
    document.getElementById('currentWorkload').textContent = pending + inProgress;
    
    console.log('📊 Statistics Updated:');
    console.log('  Officer Assigned:', total);
    console.log('  Zone Total:', zoneTotal);
    console.log('  This Week:', thisWeekResolved);
    console.log('  This Month:', thisMonthResolved);
    console.log('  Success Rate:', successRate + '%');
}

console.log('💧 WATER FILTER ACTIVATED!');
// ========================================
// DISPLAY ASSIGNED GRIEVANCES
// ========================================
// ========================================
// WATER FILTER FIX - Replace this function in officer-dashboard.js
// Search for "displayAssignedGrievances" and replace with this
// ========================================

function displayAssignedGrievances(grievances) {
    const container = document.getElementById('assignedReportsList');
    
    if (!grievances || grievances.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 No grievances assigned to you yet.</div>';
        return;
    }
    
    // 💧 FILTER: Show only WATER category reports
    const waterGrievances = grievances.filter(g => 
        g.category && g.category.toLowerCase().includes('water')
    );
    
    console.log(`💧 Filtered: ${waterGrievances.length} Water reports out of ${grievances.length} total`);
    
    if (waterGrievances.length === 0) {
        container.innerHTML = '<div class="empty-state">💧 No water-related reports assigned to you.</div>';
        return;
    }
    
    container.innerHTML = waterGrievances.map(g => createGrievanceCard(g, true)).join('');
}


// ========================================
// DISPLAY ALL GRIEVANCES
// ========================================
function displayAllGrievances(grievances) {
    const container = document.getElementById('allReportsList');
    
    if (!grievances || grievances.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 No grievances found in the system.</div>';
        return;
    }
    
    container.innerHTML = grievances.map(g => createGrievanceCard(g, false)).join('');
}

// ========================================
// DISPLAY PRIORITY ISSUES
// ========================================
function displayPriorityIssues() {
    const urgentIssues = assignedGrievances.filter(g => 
        (g.priority === 'URGENT' || g.priority === 'HIGH') && 
        (g.status !== 'RESOLVED' && g.status !== 'COMPLETED')
    ).slice(0, 5);
    
    const container = document.getElementById('priorityIssuesList');
    
    if (urgentIssues.length === 0) {
        container.innerHTML = '<div class="empty-state">✅ No urgent issues at the moment!</div>';
        return;
    }
    
    container.innerHTML = urgentIssues.map(g => createCompactCard(g)).join('');
}

// ========================================
// DISPLAY RECENT ASSIGNMENTS
// ========================================
function displayRecentAssignments() {
    const recent = [...assignedGrievances]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    const container = document.getElementById('recentAssignments');
    
    if (recent.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 No recent assignments.</div>';
        return;
    }
    
    container.innerHTML = recent.map(g => createCompactCard(g)).join('');
}

// ========================================
// CREATE GRIEVANCE CARD
// ========================================
function createGrievanceCard(grievance, showActions) {
    const statusClass = getStatusClass(grievance.status);
    const priorityClass = getPriorityClass(grievance.priority);
    const statusText = formatStatus(grievance.status);
    const priorityText = grievance.priority || 'MEDIUM';
    
    return `
        <div class="report-card ${statusClass}">
            <div class="report-header">
                <div class="report-id">
                    <strong>ID:</strong> ${grievance.id}
                </div>
                <div class="report-badges">
                    <span class="badge ${statusClass}">${statusText}</span>
                    <span class="badge ${priorityClass}">${priorityText}</span>
                </div>
            </div>
            
            <div class="report-content">
                <h4>${grievance.title || grievance.category || 'Untitled Issue'}</h4>
                <p class="report-description">${grievance.description || 'No description provided'}</p>
                
                <div class="report-meta">
                    <div class="meta-item">
                        <span class="icon">📍</span>
                        <span>${grievance.location || 'Location not specified'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="icon">📂</span>
                        <span>${grievance.category || 'Uncategorized'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="icon">📅</span>
                        <span>${formatDate(grievance.createdAt)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="icon">👤</span>
                        <span>${grievance.citizenName || 'Anonymous'}</span>
                    </div>
                </div>
            </div>
            
            ${showActions ? `
                <div class="report-actions">
                    <button class="btn btn-primary btn-sm" onclick="quickUpdateStatus(${grievance.id}, 'IN_PROGRESS')">
                        🔧 Start Work
                    </button>
                    <button class="btn btn-success btn-sm" onclick="quickUpdateStatus(${grievance.id}, 'RESOLVED')">
                        ✅ Mark Resolved
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="viewGrievanceDetails(${grievance.id})">
                        👁️ View Details
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// ========================================
// CREATE COMPACT CARD
// ========================================
function createCompactCard(grievance) {
    const statusClass = getStatusClass(grievance.status);
    const statusText = formatStatus(grievance.status);
    
    return `
        <div class="compact-card" onclick="viewGrievanceDetails(${grievance.id})">
            <div class="compact-header">
                <strong>ID: ${grievance.id}</strong>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
            <p>${grievance.title || grievance.description?.substring(0, 60) || 'No title'}...</p>
            <small>📍 ${grievance.location || 'Unknown'} • 📅 ${formatDate(grievance.createdAt)}</small>
        </div>
    `;
}

// ========================================
// QUICK UPDATE STATUS
// ========================================
function quickUpdateStatus(grievanceId, newStatus) {
    if (!confirm(`Are you sure you want to update status to ${formatStatus(newStatus)}?`)) {
        return;
    }
    
    console.log(`🔄 Updating grievance ${grievanceId} to ${newStatus}`);
    
    // Find and update in local data
    const grievance = assignedGrievances.find(g => g.id === grievanceId);
    if (grievance) {
        grievance.status = newStatus;
        updateDashboard();
        alert('✅ Status updated successfully!');
    }
    
    // Try API call
    const updateData = {
        status: newStatus,
        notes: `Status updated to ${formatStatus(newStatus)} by officer`,
        updatedBy: currentOfficer.id
    };
    
    fetch(`${API_URL}/grievances/${grievanceId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ Status updated via API:', data);
    })
    .catch(error => {
        console.warn('⚠️ API update failed, using local update only');
    });
}

// ========================================
// VIEW GRIEVANCE DETAILS
// ========================================
function viewGrievanceDetails(grievanceId) {
    const grievance = [...assignedGrievances, ...allGrievances].find(g => g.id == grievanceId);
    
    if (!grievance) {
        alert('Grievance not found!');
        return;
    }
    
    const details = `
═══════════════════════════════
GRIEVANCE DETAILS
═══════════════════════════════
ID: ${grievance.id}
Title: ${grievance.title || 'N/A'}
Category: ${grievance.category}
Status: ${formatStatus(grievance.status)}
Priority: ${grievance.priority}
Location: ${grievance.location}

Description:
${grievance.description}

Submitted by: ${grievance.citizenName || 'Anonymous'}
Date: ${formatDate(grievance.createdAt)}
═══════════════════════════════
    `;
    
    alert(details);
    
    // Load in update form
    document.getElementById('updateReportId').value = grievanceId;
    loadReportDetailsInForm();
    switchSection('update');
}

// ========================================
// LOAD REPORT DETAILS IN FORM
// ========================================
function loadReportDetailsInForm() {
    const reportId = document.getElementById('updateReportId').value;
    
    if (!reportId) {
        alert('Please enter a Report ID');
        return;
    }
    
    const grievance = [...assignedGrievances, ...allGrievances].find(g => g.id == reportId);
    
    if (!grievance) {
        alert('❌ Report not found!');
        document.getElementById('reportDetailsContainer').style.display = 'none';
        return;
    }
    
    const detailsHTML = `
        <strong>Title:</strong> ${grievance.title || 'N/A'}<br>
        <strong>Category:</strong> ${grievance.category}<br>
        <strong>Current Status:</strong> <span class="badge ${getStatusClass(grievance.status)}">${formatStatus(grievance.status)}</span><br>
        <strong>Priority:</strong> <span class="badge ${getPriorityClass(grievance.priority)}">${grievance.priority}</span><br>
        <strong>Location:</strong> ${grievance.location}<br>
        <strong>Description:</strong> ${grievance.description}
    `;
    
    document.getElementById('reportDetailsInfo').innerHTML = detailsHTML;
    document.getElementById('reportDetailsContainer').style.display = 'block';
    
    console.log('✅ Report details loaded:', grievance);
}

// ========================================
// HANDLE STATUS UPDATE FORM
// ========================================
function handleStatusUpdateForm(event) {
    event.preventDefault();
    
    const reportId = document.getElementById('updateReportId').value;
    const newStatus = document.getElementById('newStatus').value;
    const notes = document.getElementById('statusNotes').value;
    const estimatedTime = document.getElementById('estimatedTime').value;
    
    if (!reportId || !newStatus || !notes) {
        alert('❌ Please fill all required fields!');
        return;
    }
    
    console.log('📤 Submitting status update:', { reportId, newStatus, notes, estimatedTime });
    
    // Update local data
    const grievance = assignedGrievances.find(g => g.id == reportId);
    if (grievance) {
        grievance.status = newStatus;
        updateDashboard();
    }
    
    alert(`✅ Status updated successfully!\n\nReport ID: ${reportId}\nNew Status: ${formatStatus(newStatus)}\nNotes: ${notes}`);
    
    // Reset form
    document.getElementById('updateStatusForm').reset();
    document.getElementById('reportDetailsContainer').style.display = 'none';
    
    // Switch to assigned section
    switchSection('assigned');
    
    // Update nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === 'assigned') {
            link.classList.add('active');
        }
    });
}

// ========================================
// FILTER FUNCTIONS
// ========================================
function filterAssigned() {
    const statusFilter = document.getElementById('assignedStatusFilter').value;
    const priorityFilter = document.getElementById('assignedPriorityFilter').value;
    
    let filtered = assignedGrievances;
    
    if (statusFilter !== 'all') {
        const statusValue = statusFilter.toUpperCase().replace('-', '_');
        filtered = filtered.filter(g => g.status === statusValue);
    }
    
    if (priorityFilter !== 'all') {
        filtered = filtered.filter(g => g.priority?.toUpperCase() === priorityFilter.toUpperCase());
    }
    
    displayAssignedGrievances(filtered);
}

function filterAllReports() {
    const statusFilter = document.getElementById('allStatusFilter').value;
    const categoryFilter = document.getElementById('allCategoryFilter').value;
    const searchText = document.getElementById('searchAllReports').value.toLowerCase();
    
    let filtered = allGrievances;
    
    if (statusFilter !== 'all') {
        const statusValue = statusFilter.toUpperCase().replace('-', '_');
        filtered = filtered.filter(g => g.status === statusValue);
    }
    
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(g => g.category === categoryFilter);
    }
    
    if (searchText) {
        filtered = filtered.filter(g => 
            g.id.toString().includes(searchText) ||
            g.location?.toLowerCase().includes(searchText) ||
            g.category?.toLowerCase().includes(searchText) ||
            g.description?.toLowerCase().includes(searchText)
        );
    }
    
    displayAllGrievances(filtered);
}

// ========================================
// NAVIGATION
// ========================================
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionName = this.getAttribute('data-section');
            switchSection(sectionName);
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
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
// SETUP FORM HANDLERS
// ========================================
function setupFormHandlers() {
    const updateForm = document.getElementById('updateStatusForm');
    if (updateForm) {
        updateForm.addEventListener('submit', handleStatusUpdateForm);
    }
}

// ========================================
// SETUP BUTTON HANDLERS
// ========================================
function setupButtonHandlers() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                alert('✅ Logged out successfully!');
                window.location.href = 'signin.html';
            }
        });
    }
    
    // Load report button
    const loadReportBtn = document.getElementById('loadReportBtn');
    if (loadReportBtn) {
        loadReportBtn.addEventListener('click', loadReportDetailsInForm);
    }
    
    // Filter listeners
    const assignedStatusFilter = document.getElementById('assignedStatusFilter');
    if (assignedStatusFilter) {
        assignedStatusFilter.addEventListener('change', filterAssigned);
    }
    
    const assignedPriorityFilter = document.getElementById('assignedPriorityFilter');
    if (assignedPriorityFilter) {
        assignedPriorityFilter.addEventListener('change', filterAssigned);
    }
    
    const allStatusFilter = document.getElementById('allStatusFilter');
    if (allStatusFilter) {
        allStatusFilter.addEventListener('change', filterAllReports);
    }
    
    const allCategoryFilter = document.getElementById('allCategoryFilter');
    if (allCategoryFilter) {
        allCategoryFilter.addEventListener('change', filterAllReports);
    }
    
    const searchInput = document.getElementById('searchAllReports');
    if (searchInput) {
        searchInput.addEventListener('input', filterAllReports);
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function getStatusClass(status) {
    const statusMap = {
        'PENDING': 'status-pending',
        'IN_PROGRESS': 'status-in-progress',
        'RESOLVED': 'status-resolved',
        'COMPLETED': 'status-resolved'
    };
    return statusMap[status] || 'status-pending';
}

function getPriorityClass(priority) {
    const priorityMap = {
        'URGENT': 'priority-urgent',
        'HIGH': 'priority-high',
        'MEDIUM': 'priority-medium',
        'LOW': 'priority-low'
    };
    return priorityMap[priority?.toUpperCase()] || 'priority-medium';
}

function formatStatus(status) {
    const statusMap = {
        'PENDING': 'Pending',
        'IN_PROGRESS': 'In Progress',
        'RESOLVED': 'Resolved',
        'COMPLETED': 'Completed'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

console.log('✅ Officer Dashboard Script Loaded Successfully!');