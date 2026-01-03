// ========================================
// CivicPulse Hub - Homepage Script
// ========================================

let reports = [];
let reportCounter = 1001;

// Add realistic demo data for impressive stats
reports = [
    { id: 'CP1001', status: 'Resolved', email: 'user1@test.com', name: 'User 1', category: 'Road', location: 'Sector 15' },
    { id: 'CP1002', status: 'Resolved', email: 'user2@test.com', name: 'User 2', category: 'Water', location: 'Block A' },
    { id: 'CP1003', status: 'Resolved', email: 'user3@test.com', name: 'User 3', category: 'Electricity', location: 'Area 42' },
    { id: 'CP1004', status: 'Resolved', email: 'user4@test.com', name: 'User 4', category: 'Sanitation', location: 'Zone 3' },
    { id: 'CP1005', status: 'Resolved', email: 'user5@test.com', name: 'User 5', category: 'Street Light', location: 'Park Road' },
    { id: 'CP1006', status: 'Pending', email: 'user6@test.com', name: 'User 6', category: 'Road', location: 'MG Road' },
    { id: 'CP1007', status: 'Pending', email: 'user7@test.com', name: 'User 7', category: 'Water', location: 'Civil Lines' },
    { id: 'CP1008', status: 'Pending', email: 'user8@test.com', name: 'User 8', category: 'Other', location: 'Downtown' },
    { id: 'CP1009', status: 'Resolved', email: 'user9@test.com', name: 'User 9', category: 'Road', location: 'Highway' },
    { id: 'CP1010', status: 'Resolved', email: 'user10@test.com', name: 'User 10', category: 'Sanitation', location: 'Mall Road' },
    { id: 'CP1011', status: 'Resolved', email: 'user11@test.com', name: 'User 11', category: 'Electricity', location: 'Sector 22' },
    { id: 'CP1012', status: 'Pending', email: 'user12@test.com', name: 'User 12', category: 'Water', location: 'Colony B' }
];

// Check if user is logged in on page load - ONLY after page fully loads
// Authentication check is commented for testing
window.addEventListener('load', function() {
    // checkAuthStatus(); // Uncomment when backend is ready
    updateStats(); // Always update stats on load
});

// ========================================
// Check Authentication Status
// ========================================
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Debug: Log what we have
    console.log('Token:', token);
    console.log('User:', user);
    
    if (!token || !user) {
        // User is not logged in, redirect to signin after a small delay
        console.log('Not logged in, redirecting...');
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 500);
        return;
    }
    
    // User is logged in, display welcome message
    const userData = JSON.parse(user);
    console.log('Welcome,', userData);
}

// ========================================
// Update Statistics Dashboard with ANIMATION
// ========================================
function updateStats() {
    const totalReports = reports.length;
    const resolvedReports = reports.filter(r => r.status === 'Resolved').length;
    const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;
    
    // Active citizens = at least 1 (current user)
    const uniqueEmails = [...new Set(reports.map(r => r.email))];
    const activeCitizens = Math.max(1, uniqueEmails.length);
    
    // Animate numbers from 0 to target value
    animateValue('totalReports', 0, totalReports, 1500);
    animateValue('resolvedReports', 0, resolvedReports, 1500);
    animateValue('resolutionRate', 0, resolutionRate, 1500, '%');
    animateValue('activeCitizens', 0, activeCitizens, 1500);
}

// ========================================
// Animate Number Function
// ========================================
function animateValue(id, start, end, duration, suffix = '') {
    const element = document.getElementById(id);
    if (!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + suffix;
    }, 16);
}

// ========================================
// Logout Function - With confirmation but no success alert
// ========================================
function handleLogout() {
    const confirmLogout = confirm('Are you sure you want to logout?');
    
    if (confirmLogout) {
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Direct redirect to signin page - NO SUCCESS ALERT
        window.location.href = 'signin.html';
    }
}

// ========================================
// Report Generation
// ========================================
function generateReportId() {
    return `CP${reportCounter++}`;
}

// ========================================
// Modal Functions
// ========================================
function openReportModal() {
    document.getElementById('reportModal').style.display = 'block';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
    document.getElementById('reportForm').reset();
}

function openTrackModal() {
    document.getElementById('trackModal').style.display = 'block';
    displayAllReports();
}

function closeTrackModal() {
    document.getElementById('trackModal').style.display = 'none';
}

// ========================================
// Navigation Functions
// ========================================
function showHome() {
    document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
}

function showFeatures() {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
}

function showAbout() {
    document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
}

function showContact() {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
}

// ========================================
// Report Submission
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const report = {
                id: generateReportId(),
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                category: document.getElementById('category').value,
                location: document.getElementById('location').value,
                description: document.getElementById('description').value,
                status: 'Pending',
                date: new Date().toLocaleString(),
                photo: document.getElementById('photo').files[0]?.name || 'No photo'
            };

            reports.push(report);
            
            // Update stats after adding report
            updateStats();
            
            alert(`✅ Report Submitted Successfully!\n\nReport ID: ${report.id}\nCategory: ${report.category}\nLocation: ${report.location}\n\nYou can track your report status using the Track Status button.`);
            
            closeReportModal();
        });
    }
});

// ========================================
// Display Reports
// ========================================
function displayAllReports() {
    const reportList = document.getElementById('reportList');
    
    if (reports.length === 0) {
        reportList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">No reports submitted yet. Submit your first report!</p>';
        return;
    }

    reportList.innerHTML = reports.map(report => `
        <div class="report-card">
            <div class="report-header">
                <div>
                    <div class="report-id">${report.id}</div>
                    <div style="color: #64748b; font-size: 0.9rem;">${report.date}</div>
                </div>
                <span class="status-badge status-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span>
            </div>
            <div class="report-details">
                <p><strong>Category:</strong> ${report.category}</p>
                <p><strong>Location:</strong> ${report.location}</p>
                <p><strong>Description:</strong> ${report.description}</p>
                <p><strong>Submitted by:</strong> ${report.name} (${report.email})</p>
            </div>
        </div>
    `).join('');
}

// ========================================
// Search Reports
// ========================================
function searchReports() {
    const email = document.getElementById('searchEmail').value.toLowerCase();
    const reportList = document.getElementById('reportList');
    
    if (!email) {
        displayAllReports();
        return;
    }

    const filteredReports = reports.filter(report => report.email.toLowerCase() === email);
    
    if (filteredReports.length === 0) {
        reportList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">No reports found for this email address.</p>';
        return;
    }

    reportList.innerHTML = filteredReports.map(report => `
        <div class="report-card">
            <div class="report-header">
                <div>
                    <div class="report-id">${report.id}</div>
                    <div style="color: #64748b; font-size: 0.9rem;">${report.date}</div>
                </div>
                <span class="status-badge status-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span>
            </div>
            <div class="report-details">
                <p><strong>Category:</strong> ${report.category}</p>
                <p><strong>Location:</strong> ${report.location}</p>
                <p><strong>Description:</strong> ${report.description}</p>
            </div>
        </div>
    `).join('');
}

// ========================================
// Modal Close on Outside Click
// ========================================
window.onclick = function(event) {
    const reportModal = document.getElementById('reportModal');
    const trackModal = document.getElementById('trackModal');
    if (event.target == reportModal) {
        closeReportModal();
    }
    if (event.target == trackModal) {
        closeTrackModal();
    }
}

// ========================================
// Smooth Scrolling for Anchor Links
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});