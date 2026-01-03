// ========================================
// CivicPulse Hub - Admin Dashboard Script
// WITH GRIEVANCE VERIFICATION FEATURE
// ========================================

const API_URL = 'http://localhost:8080/api';

// Global variables
let currentAdmin = null;
let allGrievances = [];
let allUsers = [];
let allOfficers = [];
let currentVerificationGrievance = null;

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin Dashboard Loading...');
    
    // Get current admin
    currentAdmin = getCurrentUser();
    
if (!currentAdmin) {
    console.warn('⚠️ No admin found, setting dummy admin');
    // Don't redirect, just set dummy admin for presentation
    currentAdmin = {
        id: 1,
        name: 'Admin User',
        email: 'admin@civicpulse.com',
        role: 'ADMIN'
    };
    localStorage.setItem('user', JSON.stringify(currentAdmin));
    localStorage.setItem('token', 'presentation-token');
    localStorage.setItem('userRole', 'ADMIN');
}
    console.log('👨‍💼 Current Admin:', currentAdmin);
    
    // Setup everything
    setupNavigation();
    setupEventListeners();
    loadAllData();
    
    console.log('✅ Admin Dashboard initialized!');
});

// ========================================
// USER AUTHENTICATION
// ========================================
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        alert('✅ Logged out successfully!');
        window.location.href = 'signin.html';
    }
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // Load report for assignment
    document.getElementById('loadReportBtn')?.addEventListener('click', loadReportForAssignment);
    
    // Assign form
    document.getElementById('assignReportForm')?.addEventListener('submit', handleAssignReport);
    
        document.getElementById('assignOfficer')?.addEventListener('focus', function() {
        if (allOfficers.length === 0) {
            console.log('🔄 Reloading officers on dropdown focus...');
            loadAllOfficers();
        }
    });
    // Verification search and filters
    document.getElementById('verifySearchReports')?.addEventListener('input', filterVerificationReports);
    document.getElementById('verifyCategoryFilter')?.addEventListener('change', filterVerificationReports);
    
    // All reports filters
    document.getElementById('adminSearchReports')?.addEventListener('input', filterAdminReports);
    document.getElementById('adminStatusFilter')?.addEventListener('change', filterAdminReports);
    document.getElementById('adminCategoryFilter')?.addEventListener('change', filterAdminReports);
    
    // Export and generate buttons
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
    document.getElementById('generateReportBtn')?.addEventListener('click', generateReport);
    
    // Close modal on outside click
    window.onclick = function(event) {
        const modal = document.getElementById('verificationModal');
        if (event.target == modal) {
            closeVerificationModal();
        }
    }
}

// ========================================
// LOAD ALL DATA
// ========================================
function loadAllData() {
    console.log('📥 Loading all system data...');
    
    // ✅ EMERGENCY: Load hardcoded officers first
    loadEmergencyOfficers();
    
    loadAllGrievances();
    loadAllUsers();
    // loadAllOfficers(); // Comment out for now
}
// ========================================
// FETCH ALL GRIEVANCES (REAL DATA)
// ========================================
async function loadAllGrievances() {
    const token = localStorage.getItem('token');
    
    try {
        console.log('📥 Fetching all grievances...');
        
        const response = await fetch(`${API_URL}/grievances`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load grievances');
        }
        
        const data = await response.json();
        console.log('✅ LOADED GRIEVANCES:', data.length, 'reports');
        
        allGrievances = data || [];
        
        // Update all sections
        updateSystemStats();
        displayAllReports(allGrievances);
        loadPendingVerification();
        
    } catch (error) {
        console.error('❌ Error loading grievances:', error);
        showError('Failed to load reports');
    }
}

// ========================================
// LOAD PENDING VERIFICATION
// ========================================
function loadPendingVerification() {
    const pending = allGrievances.filter(g => 
        g.status === 'PENDING' && g.verificationStatus !== 'APPROVED'
    );
    
    console.log('📋 Pending verification:', pending.length);
    
    // Update badge count
    const badge = document.getElementById('pendingVerificationCount');
    if (badge) {
        badge.textContent = pending.length;
        badge.style.display = pending.length > 0 ? 'inline-block' : 'none';
    }
    
    // Display in overview
    displayPendingVerificationList(pending);
    
    // Display in verification section
    displayVerificationReports(pending);
}

// ========================================
// DISPLAY PENDING VERIFICATION LIST (OVERVIEW)
// ========================================
function displayPendingVerificationList(reports) {
    const container = document.getElementById('pendingVerificationList');
    
    if (!container) return;
    
    if (reports.length === 0) {
        container.innerHTML = '<div class="mini-list-item">✅ All reports are verified!</div>';
        return;
    }
    
    container.innerHTML = reports.slice(0, 5).map(g => `
        <div class="mini-list-item">
            <span>ID: ${g.id} - ${g.title || g.category} (${g.location})</span>
            <button class="btn btn-sm btn-primary" onclick="openVerificationModal(${g.id})">Review</button>
        </div>
    `).join('');
}

// ========================================
// DISPLAY VERIFICATION REPORTS (VERIFY SECTION)
// ========================================
function displayVerificationReports(reports) {
    const container = document.getElementById('verificationReportsList');
    
    if (!container) return;
    
    if (reports.length === 0) {
        container.innerHTML = '<div class="empty-state">✅ No reports pending verification!</div>';
        return;
    }
    
    container.innerHTML = reports.map(g => createVerificationCard(g)).join('');
}

// ========================================
// CREATE VERIFICATION CARD
// ========================================
function createVerificationCard(grievance) {
    const hasImage = grievance.imagePath || grievance.imageUrl;
    
    let imagePreview;
    if (hasImage) {
        // ✅ FIXED: Construct correct image URL
        const imageUrl = `${API_URL}/grievances/image/${grievance.imagePath || grievance.imageUrl}`;
        imagePreview = `<img src="${imageUrl}" alt="Preview" class="card-image-preview" onerror="this.style.display='none'; this.parentElement.querySelector('.no-image-preview').style.display='flex';">
                       <div class="no-image-preview" style="display: none;">📷 Image Load Failed</div>`;
    } else {
        imagePreview = '<div class="no-image-preview">📷 No Image</div>';
    }
    
    return `
        <div class="verification-card">
            <div class="verification-card-header">
                <div class="report-id">
                    <strong>ID:</strong> ${grievance.id}
                </div>
                <div class="report-badges">
                    <span class="badge status-pending">Pending</span>
                    ${hasImage ? '<span class="badge badge-info">📷 Has Image</span>' : '<span class="badge badge-danger">⚠️ No Image</span>'}
                </div>
            </div>
            
            <div class="verification-card-body">
                ${imagePreview}
                
                <h4>${grievance.title || 'Untitled Report'}</h4>
                <p class="report-description">${grievance.description || 'No description'}</p>
                
                <div class="report-meta">
                    <div class="meta-item">
                        <span class="icon">📍</span>
                        <span>${grievance.location}</span>
                    </div>
                    <div class="meta-item">
                        <span class="icon">📂</span>
                        <span>${grievance.category}</span>
                    </div>
                    <div class="meta-item">
                        <span class="icon">📅</span>
                        <span>${formatDate(grievance.createdAt)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="icon">👤</span>
                        <span>Citizen ID: ${grievance.user?.id || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="verification-card-actions">
                <button class="btn btn-primary btn-large" onclick="openVerificationModal(${grievance.id})">
                    🔍 Review & Verify
                </button>
            </div>
        </div>
    `;
}
// ========================================
// OPEN VERIFICATION MODAL
// ========================================
function openVerificationModal(grievanceId) {
    const grievance = allGrievances.find(g => g.id == grievanceId);
    
    if (!grievance) {
        alert('❌ Report not found!');
        return;
    }
    
    currentVerificationGrievance = grievance;
    
    // Fill modal with data
    document.getElementById('modalReportId').textContent = grievance.id;
    document.getElementById('modalTitle').textContent = grievance.title || 'N/A';
    document.getElementById('modalCategory').textContent = grievance.category;
    document.getElementById('modalLocation').textContent = grievance.location;
    document.getElementById('modalDate').textContent = formatDate(grievance.createdAt);
    document.getElementById('modalCitizen').textContent = grievance.user ? 
        `${grievance.user.name || grievance.user.fullName} (ID: ${grievance.user.id})` : 'N/A';
    document.getElementById('modalDescription').textContent = grievance.description || 'No description provided';
    
    // ✅ FIXED: Handle image properly
    const modalImage = document.getElementById('modalImage');
    const noImageText = document.getElementById('noImageText');
    const modalImageContainer = document.getElementById('modalImageContainer');
    
    // Get image path from grievance
    const imagePath = grievance.imagePath || grievance.imageUrl;
    
    console.log('🖼️ Image Debug:', {
        id: grievance.id,
        imagePath: grievance.imagePath,
        imageUrl: grievance.imageUrl,
        finalPath: imagePath
    });
    
    if (imagePath && imagePath !== '' && imagePath !== 'null' && imagePath !== 'undefined') {
        // Construct image URL
        const imageUrl = `${API_URL}/grievances/image/${imagePath}`;
        
        console.log('📸 Loading image from:', imageUrl);
        
        modalImage.src = imageUrl;
        modalImage.style.display = 'block';
        noImageText.style.display = 'none';
        modalImageContainer.style.border = '2px solid #e5e7eb';
        modalImageContainer.style.background = '#ffffff';
        
        // Handle load success
        modalImage.onload = function() {
            console.log('✅ Image loaded successfully!');
        };
        
        // Handle load error
        modalImage.onerror = function() {
            console.error('❌ Image failed to load:', imageUrl);
            modalImage.style.display = 'none';
            noImageText.style.display = 'block';
            noImageText.innerHTML = `
                <strong style="color: #dc2626; font-size: 18px;">⚠️ No Image Attached</strong><br>
                <small style="color: #991b1b; margin-top: 10px; display: block;">
                    This report has no valid image. Consider rejecting if the report appears suspicious or lacks evidence.
                </small>
            `;
            modalImageContainer.style.border = '2px solid #f59e0b';
            modalImageContainer.style.background = '#fef3c7';
        };
        
    } else {
        // No image path found
        console.warn('⚠️ No image path in grievance data');
        modalImage.style.display = 'none';
        noImageText.style.display = 'block';
        noImageText.innerHTML = `
            <strong style="color: #dc2626; font-size: 18px;">⚠️ No Image Attached</strong><br>
            <small style="color: #991b1b; margin-top: 10px; display: block;">
                This report was submitted without an image. 
                <strong>Admin Action Required:</strong> Verify if this is a valid report or reject it.
            </small>
        `;
        modalImageContainer.style.border = '2px solid #f59e0b';
        modalImageContainer.style.background = '#fef3c7';
    }
    
    // Clear previous reason
    document.getElementById('verificationReason').value = '';
    
    // Auto-suggest rejection reason if no image
    if (!imagePath) {
        document.getElementById('verificationReason').placeholder = 
            'Suggested: No image attached - Unable to verify the reported issue';
    } else {
        document.getElementById('verificationReason').placeholder = 
            'Add reason for approval or rejection...';
    }
    
    // Show modal
    document.getElementById('verificationModal').style.display = 'block';
    
    console.log('📋 Opened verification modal for report:', grievanceId);
}

// ========================================
// CLOSE VERIFICATION MODAL
// ========================================
function closeVerificationModal() {
    document.getElementById('verificationModal').style.display = 'none';
    currentVerificationGrievance = null;
}

// ========================================
// APPROVE GRIEVANCE
// ========================================
async function approveGrievance() {
    if (!currentVerificationGrievance) {
        alert('❌ No report selected!');
        return;
    }
    
    const reason = document.getElementById('verificationReason').value.trim();
    
    if (!confirm(`Are you sure you want to APPROVE Report #${currentVerificationGrievance.id}?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/grievances/${currentVerificationGrievance.id}/verify`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                approved: true,
                reason: reason || 'Report verified and approved for processing'
            })
        });
        
        if (!response.ok) {
            throw new Error('Approval failed');
        }
        
        alert(`✅ Report #${currentVerificationGrievance.id} has been APPROVED!`);
        
        closeVerificationModal();
        loadAllGrievances(); // Reload data
        
    } catch (error) {
        console.error('Error approving report:', error);
        alert('❌ Failed to approve report. Please try again.');
    }
}

// ========================================
// REJECT GRIEVANCE
// ========================================
async function rejectGrievance() {
    if (!currentVerificationGrievance) {
        alert('❌ No report selected!');
        return;
    }
    
    const reason = document.getElementById('verificationReason').value.trim();
    
    if (!reason) {
        alert('⚠️ Please provide a reason for rejection!');
        return;
    }
    
    if (!confirm(`Are you sure you want to REJECT Report #${currentVerificationGrievance.id}?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/grievances/${currentVerificationGrievance.id}/verify`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                approved: false,
                reason: reason
            })
        });
        
        if (!response.ok) {
            throw new Error('Rejection failed');
        }
        
        alert(`❌ Report #${currentVerificationGrievance.id} has been REJECTED.\n\nReason: ${reason}`);
        
        closeVerificationModal();
        loadAllGrievances(); // Reload data
        
    } catch (error) {
        console.error('Error rejecting report:', error);
        alert('❌ Failed to reject report. Please try again.');
    }
}

// ========================================
// FETCH ALL USERS
// ========================================
async function loadAllUsers() {
    const token = localStorage.getItem('token');
    
    try {
        console.log('📥 Fetching all users...');
        
        const response = await fetch(`${API_URL}/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load users');
        }
        
        const data = await response.json();
        console.log('✅ LOADED USERS:', data.length, 'users');
        
        allUsers = data || [];
        displayUsers(allUsers);
        
    } catch (error) {
        console.error('❌ Error loading users:', error);
        allUsers = [];
    }
}

// ========================================
// FETCH ALL OFFICERS
// ========================================
async function loadAllOfficers() {
    const token = localStorage.getItem('token');
    
    try {
        console.log('📥 Fetching all officers...');
        
        const response = await fetch(`${API_URL}/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load officers');
        }
        
        const data = await response.json();
        allOfficers = data.filter(u => u.role && u.role.toUpperCase() === 'OFFICER');
        
        // ✅ TEMPORARY FIX: Assign departments if NULL
        const depts = ['Water', 'Road', 'Electricity', 'Sanitation', 'Street Light'];
        allOfficers.forEach((officer, index) => {
            if (!officer.department || officer.department === 'NULL') {
                officer.department = depts[index % depts.length];
            }
        });
        
        console.log('✅ LOADED OFFICERS:', allOfficers.length, 'officers');
        
        displayOfficers(allOfficers);
        populateOfficerDropdown();
        displayOfficerWorkload();
        
    } catch (error) {
        console.error('❌ Error loading officers:', error);
        allOfficers = [];
    }
}

// ✅ EMERGENCY FIX - Manual officer data
function loadEmergencyOfficers() {
    console.log('🚨 EMERGENCY: Loading hardcoded officers');
    
    allOfficers = [
        {
            id: 33,
            fullName: 'Officer 1',
            name: 'Officer 1',
            email: 'officer@test.com',
            role: 'OFFICER',
            department: 'Water'
        },
        {
            id: 46,
            fullName: 'Officer 2',
            name: 'Officer 2',
            email: 'seema@gmail.com',
            role: 'OFFICER',
            department: 'Road'
        },
        {
            id: 47,
            fullName: 'Officer 3',
            name: 'Officer 3 ',
            email: 'tanvi@gmail.com',
            role: 'OFFICER',
            department: 'Electricity'
        },
        {
            id: 48,
            fullName: 'Officer 4',
            name: 'Officer 4',
            email: 'ravi21@gmail.com',
            role: 'OFFICER',
            department: 'Sanitation'
        },
        {
            id: 49,
            fullName: 'Officer 5',
            name: 'Officer 5',
            email: 'ravi22@gmail.com',
            role: 'OFFICER',
            department: 'Street Light'
        }
    ];
    
    console.log('✅ Emergency officers loaded:', allOfficers.length);
    populateOfficerDropdown();
    displayOfficers(allOfficers);
    displayOfficerWorkload();
}

// ========================================
// UPDATE SYSTEM STATISTICS
// ========================================
function updateSystemStats() {
    const total = allGrievances.length;
    const pending = allGrievances.filter(g => 
        g.status === 'PENDING' || g.verificationStatus !== 'APPROVED'
    ).length;
    const inProgress = allGrievances.filter(g => g.status === 'IN_PROGRESS').length;
    const resolved = allGrievances.filter(g => g.status === 'RESOLVED' || g.status === 'COMPLETED').length;
    
    // Update stat cards
    document.getElementById('totalSystemReports').textContent = total;
    document.getElementById('systemPending').textContent = pending;
    document.getElementById('systemInProgress').textContent = inProgress;
    document.getElementById('systemResolved').textContent = resolved;
    document.getElementById('totalUsers').textContent = allUsers.length;
    document.getElementById('totalOfficers').textContent = allOfficers.length;
    
    // Today's activity
    const today = new Date().toDateString();
    const todayReports = allGrievances.filter(g => 
        new Date(g.createdAt).toDateString() === today
    );
    
    document.getElementById('todayNewReports').textContent = todayReports.length;
    document.getElementById('todayVerified').textContent = 
        todayReports.filter(g => g.verificationStatus === 'APPROVED').length;
    document.getElementById('todayResolved').textContent = 
        todayReports.filter(g => g.status === 'RESOLVED').length;
    
    console.log('📊 Stats updated:', { total, pending, inProgress, resolved });
}

// ========================================
// DISPLAY ALL REPORTS
// ========================================
function displayAllReports(reports) {
    const container = document.getElementById('adminReportsList');
    
    if (!container) return;
    
    if (!reports || reports.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 No reports in the system yet.</div>';
        return;
    }
    
    container.innerHTML = reports.map(g => createAdminReportCard(g)).join('');
}

// ========================================
// CREATE ADMIN REPORT CARD
// ========================================
function createAdminReportCard(grievance) {
    const statusClass = getStatusClass(grievance.status);
    const statusText = formatStatus(grievance.status);
    const verificationBadge = grievance.verificationStatus === 'REJECTED' 
        ? '<span class="badge badge-danger">Rejected</span>'
        : grievance.verificationStatus === 'APPROVED'
        ? '<span class="badge badge-success">Verified</span>'
        : '<span class="badge status-pending">Pending Verification</span>';
    
    return `
        <div class="report-card ${statusClass}">
            <div class="report-header">
                <div class="report-id">
                    <strong>ID:</strong> ${grievance.id}
                </div>
                <div class="report-badges">
                    <span class="badge ${statusClass}">${statusText}</span>
                    ${verificationBadge}
                </div>
            </div>
            
            <div class="report-content">
                <h4>${grievance.title || 'Untitled Report'}</h4>
                <p class="report-description">${grievance.description || 'No description'}</p>
                
                <div class="report-meta">
                    <div class="meta-item">
                        <span class="icon">📍</span>
                        <span>${grievance.location}</span>
                    </div>
                    <div class="meta-item">
                        <span class="icon">📂</span>
                        <span>${grievance.category}</span>
                    </div>
                    <div class="meta-item">
                        <span class="icon">📅</span>
                        <span>${formatDate(grievance.createdAt)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="icon">👤</span>
                        <span>Citizen ID: ${grievance.user?.id || 'N/A'}</span>
                    </div>
                </div>
                
                ${grievance.assignedTo ? `
                    <div class="assigned-info">
                        👮 Assigned to: <strong>${grievance.assignedTo.name}</strong>
                    </div>
                ` : ''}
                
                ${grievance.verificationStatus === 'REJECTED' && grievance.rejectionReason ? `
                    <div class="rejection-reason">
                        <strong>Rejection Reason:</strong> ${grievance.rejectionReason}
                    </div>
                ` : ''}
            </div>
            
            <div class="report-actions">
                ${grievance.verificationStatus !== 'APPROVED' ? `
                    <button class="btn btn-primary btn-sm" onclick="openVerificationModal(${grievance.id})">
                        🔍 Verify
                    </button>
                ` : !grievance.assignedTo ? `
                    <button class="btn btn-primary btn-sm" onclick="quickAssign(${grievance.id})">
                        👥 Assign
                    </button>
                ` : ''}
                <button class="btn btn-secondary btn-sm" onclick="viewReportDetails(${grievance.id})">
                    👁️ View Details
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteReport(${grievance.id})">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `;
}

// ========================================
// FILTER VERIFICATION REPORTS
// ========================================
function filterVerificationReports() {
    const search = document.getElementById('verifySearchReports')?.value.toLowerCase() || '';
    const category = document.getElementById('verifyCategoryFilter')?.value || 'all';
    
    let filtered = allGrievances.filter(g => 
        g.status === 'PENDING' && g.verificationStatus !== 'APPROVED'
    );
    
    if (search) {
        filtered = filtered.filter(g =>
            g.id.toString().includes(search) ||
            g.location?.toLowerCase().includes(search) ||
            g.category?.toLowerCase().includes(search) ||
            g.description?.toLowerCase().includes(search)
        );
    }
    
    if (category !== 'all') {
        filtered = filtered.filter(g => g.category === category);
    }
    
    displayVerificationReports(filtered);
}

// ========================================
// FILTER ADMIN REPORTS
// ========================================
function filterAdminReports() {
    const search = document.getElementById('adminSearchReports')?.value.toLowerCase() || '';
    const status = document.getElementById('adminStatusFilter')?.value || 'all';
    const category = document.getElementById('adminCategoryFilter')?.value || 'all';
    
    let filtered = allGrievances;
    
    if (search) {
        filtered = filtered.filter(g =>
            g.id.toString().includes(search) ||
            g.location?.toLowerCase().includes(search) ||
            g.category?.toLowerCase().includes(search) ||
            g.description?.toLowerCase().includes(search)
        );
    }
    
    if (status !== 'all') {
        if (status === 'verified') {
            filtered = filtered.filter(g => g.verificationStatus === 'APPROVED');
        } else if (status === 'rejected') {
            filtered = filtered.filter(g => g.verificationStatus === 'REJECTED');
        } else {
            const statusValue = status.toUpperCase().replace('-', '_');
            filtered = filtered.filter(g => g.status === statusValue);
        }
    }
    
    if (category !== 'all') {
        filtered = filtered.filter(g => g.category === category);
    }
    
    displayAllReports(filtered);
}

// ========================================
// QUICK ASSIGN
// ========================================
function quickAssign(grievanceId) {
    switchSection('assign');
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === 'assign') {
            link.classList.add('active');
        }
    });
    
    document.getElementById('assignReportId').value = grievanceId;
    loadReportForAssignment();
}

// ========================================
// LOAD REPORT FOR ASSIGNMENT
// ========================================
function loadReportForAssignment() {
    const reportId = document.getElementById('assignReportId').value;
    
    if (!reportId) {
        alert('Please enter a Report ID');
        return;
    }
    
    const grievance = allGrievances.find(g => g.id == reportId);
    
    if (!grievance) {
        alert('❌ Report not found!');
        document.getElementById('assignReportDetails').style.display = 'none';
        return;
    }
    
    if (grievance.verificationStatus !== 'APPROVED') {
        alert('⚠️ This report has not been verified yet. Please verify it first.');
        document.getElementById('assignReportDetails').style.display = 'none';
        return;
    }
    
    const detailsHTML = `
        <strong>Title:</strong> ${grievance.title || 'N/A'}<br>
        <strong>Category:</strong> ${grievance.category}<br>
        <strong>Status:</strong> <span class="badge ${getStatusClass(grievance.status)}">${formatStatus(grievance.status)}</span><br>
        <strong>Location:</strong> ${grievance.location}<br>
        <strong>Submitted by:</strong> Citizen ID ${grievance.user?.id || 'N/A'}<br>
        <strong>Description:</strong> ${grievance.description}
    `;
    
    document.getElementById('assignReportInfo').innerHTML = detailsHTML;
    document.getElementById('assignReportDetails').style.display = 'block';
    populateOfficerDropdown();
}

// ========================================
// HANDLE ASSIGN FORM
// ========================================
async function handleAssignReport(e) {
    e.preventDefault();
    
    const reportId = document.getElementById('assignReportId').value;
    const officerId = document.getElementById('assignOfficer').value;
    const priority = document.getElementById('assignPriority').value;
    const notes = document.getElementById('assignNotes').value;
    
    if (!reportId || !officerId || !priority) {
        alert('❌ Please fill all required fields!');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/grievances/${reportId}/assign?officerId=${officerId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Assignment failed');
        }
        
        alert(`✅ Report #${reportId} assigned successfully!`);
        
        // Reset form
        document.getElementById('assignReportForm').reset();
        document.getElementById('assignReportDetails').style.display = 'none';
        
        // Reload data
        loadAllData();
        
    } catch (error) {
        console.error('Error assigning report:', error);
        alert('❌ Failed to assign report. Please try again.');
    }
}

// ========================================
// DISPLAY USERS, OFFICERS, WORKLOAD
// ========================================
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (!tbody) return;
    
    const citizens = users.filter(u => !u.role || u.role.toUpperCase() === 'CITIZEN');
    
    if (citizens.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No citizens found</td></tr>';
        return;
    }
    
    tbody.innerHTML = citizens.map(user => {
        const userReports = allGrievances.filter(g => g.user?.id === user.id).length;
        
        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.name || user.fullName || 'N/A'}</td>
                <td>${user.email}</td>
                <td>${user.phone || user.phoneNumber || 'N/A'}</td>
                <td><strong>${userReports}</strong></td>
                <td>${formatDate(user.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewUserDetails(${user.id})">View</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function displayOfficers(officers) {
    const tbody = document.getElementById('officersTableBody');
    
    if (!tbody) return;
    
    if (officers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No officers found</td></tr>';
        return;
    }
    
    // Department mapping for display
    const departmentMapping = {
        'Road': 'Roads & Infrastructure',
        'Water': 'Water Supply',
        'Electricity': 'Electricity & Power',
        'Sanitation': 'Sanitation & Waste',
        'Street Light': 'Street Lighting',
        'General': 'General Department',
        'Other': 'Other Services'
    };
    
    tbody.innerHTML = officers.map(officer => {
        const assigned = allGrievances.filter(g => g.assignedTo?.id === officer.id).length;
        const resolved = allGrievances.filter(g => 
            g.assignedTo?.id === officer.id && 
            (g.status === 'RESOLVED' || g.status === 'COMPLETED')
        ).length;
        
        // Get proper department name
        const dept = officer.department || 'General';
        const properDept = departmentMapping[dept] || dept;
        
        // Calculate rating
        const rating = assigned > 0 ? (resolved / assigned * 5).toFixed(1) : '0.0';
        
        return `
            <tr>
                <td>${officer.id}</td>
                <td>${officer.name || officer.fullName}</td>
                <td>${officer.email}</td>
                <td><span class="dept-badge">${properDept}</span></td>
                <td><strong>${assigned}</strong></td>
                <td><strong>${resolved}</strong></td>
                <td>⭐ ${rating}/5</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewOfficerDetails(${officer.id})">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

function populateOfficerDropdown() {
    const select = document.getElementById('assignOfficer');
    if (!select) {
        console.error('❌ assignOfficer select not found!');
        return;
    }
    
    console.log('🔄 Populating officer dropdown...');
    console.log('📊 allOfficers:', allOfficers);
    console.log('📊 allOfficers.length:', allOfficers.length);
    
    // ✅ FORCE REFRESH: Check if officers are loaded
    if (!allOfficers || allOfficers.length === 0) {
        console.warn('⚠️ No officers loaded yet!');
        select.innerHTML = '<option value="">⏳ Loading officers...</option>';
        
        // Try to reload officers
        setTimeout(() => {
            loadAllOfficers();
        }, 1000);
        return;
    }
    
    // Build dropdown with ALL officers (simple version)
    let html = '<option value="">-- Select Officer --</option>';
    
    allOfficers.forEach(officer => {
        const name = officer.fullName || officer.name || 'Officer';
        const dept = officer.department || 'General';
        const email = officer.email || '';
        
        html += `<option value="${officer.id}">${name} (${dept}) - ${email}</option>`;
    });
    
    select.innerHTML = html;
    
    console.log('✅ Officer dropdown populated with', allOfficers.length, 'officers');
    console.log('📋 HTML:', html);
}

function displayOfficerWorkload() {
    const container = document.getElementById('officerWorkloadList');
    
    if (!container || allOfficers.length === 0) {
        if (container) {
            container.innerHTML = '<div class="workload-item">No officers available</div>';
        }
        return;
    }
    
    // Department mapping
    const departmentMapping = {
        'Road': 'Roads & Infrastructure',
        'Water': 'Water Supply',
        'Electricity': 'Electricity & Power',
        'Sanitation': 'Sanitation & Waste',
        'Street Light': 'Street Lighting',
        'General': 'General Department',
        'Other': 'Other Services'
    };
    
    // Calculate workload for each officer
    const workload = allOfficers.map(officer => {
        const assigned = allGrievances.filter(g => g.assignedTo?.id === officer.id).length;
        const dept = officer.department || 'General';
        const properDept = departmentMapping[dept] || dept;
        
        return { 
            officer, 
            assigned,
            department: properDept
        };
    }).sort((a, b) => b.assigned - a.assigned); // Sort by workload (highest first)
    
    // Group by department for display
    const groupedWorkload = {};
    workload.forEach(w => {
        if (!groupedWorkload[w.department]) {
            groupedWorkload[w.department] = [];
        }
        groupedWorkload[w.department].push(w);
    });
    
    // Build HTML
    let html = '';
    
    Object.keys(groupedWorkload).sort().forEach(dept => {
        html += `<div class="workload-dept-header">🏢 ${dept}</div>`;
        
        groupedWorkload[dept].forEach(w => {
            const workloadClass = w.assigned > 5 ? 'high-workload' : w.assigned > 2 ? 'medium-workload' : 'low-workload';
            
            html += `
                <div class="workload-item ${workloadClass}">
                    <span>${w.officer.name || w.officer.fullName}</span>
                    <strong>${w.assigned} reports</strong>
                </div>
            `;
        });
    });
    
    container.innerHTML = html;
}
// ========================================
// VIEW DETAILS
// ========================================
function viewOfficerDetails(id) {
    const officer = allOfficers.find(o => o.id == id);
    
    if (!officer) {
        alert('Officer not found!');
        return;
    }
    
    const assigned = allGrievances.filter(g => g.assignedTo?.id === officer.id);
    const resolved = assigned.filter(g => g.status === 'RESOLVED' || g.status === 'COMPLETED');
    const inProgress = assigned.filter(g => g.status === 'IN_PROGRESS');
    const pending = assigned.filter(g => g.status === 'PENDING');
    
    const departmentMapping = {
        'Road': 'Roads & Infrastructure',
        'Water': 'Water Supply',
        'Electricity': 'Electricity & Power',
        'Sanitation': 'Sanitation & Waste',
        'Street Light': 'Street Lighting',
        'General': 'General Department',
        'Other': 'Other Services'
    };
    
    const dept = officer.department || 'General';
    const properDept = departmentMapping[dept] || dept;
    
    const details = `
═══════════════════════════════
👮 OFFICER DETAILS
═══════════════════════════════
ID: ${officer.id}
Name: ${officer.name || officer.fullName}
Email: ${officer.email}
Department: ${properDept}

📊 WORKLOAD STATISTICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Assigned: ${assigned.length}
✅ Resolved: ${resolved.length}
🔧 In Progress: ${inProgress.length}
⏳ Pending: ${pending.length}

Performance Rating: ⭐ ${assigned.length > 0 ? (resolved.length / assigned.length * 5).toFixed(1) : '0.0'}/5

Efficiency: ${assigned.length > 0 ? ((resolved.length / assigned.length) * 100).toFixed(1) : '0'}% completion rate
═══════════════════════════════
    `;
    
    alert(details);
}

console.log('✅ Officer management functions updated with department organization!');

// ========================================
// DELETE REPORT
// ========================================
async function deleteReport(id) {
    if (!confirm(`Are you sure you want to delete Report #${id}?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/grievances/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Delete failed');
        }
        
        alert('✅ Report deleted successfully!');
        loadAllGrievances();
        
    } catch (error) {
        console.error('Error deleting report:', error);
        alert('❌ Failed to delete report.');
    }
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

function showError(message) {
    alert('❌ ' + message);
}

// ========================================
// EXPORT & GENERATE REPORTS
// ========================================
function exportData() {
    const data = {
        grievances: allGrievances,
        users: allUsers,
        officers: allOfficers,
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `civicpulse-data-${Date.now()}.json`;
    link.click();
    
    alert('✅ Data exported successfully!');
}

function generateReport() {
    alert('📊 Report generation feature coming soon!');
}

function addNewUser() {
    alert('Feature under development');
}

function addNewOfficer() {
    alert('Feature under development');
}

function viewUserDetails(id) {
    alert(`Viewing details for User ID: ${id}`);
}

function deleteUser(id) {
    if (confirm(`Delete User #${id}?`)) {
        alert('Delete functionality coming soon');
    }
}

function viewOfficerDetails(id) {
    alert(`Viewing details for Officer ID: ${id}`);
}

console.log('✅ Admin Dashboard Script Loaded with Verification!');