// ========================================
// CivicPulse Hub - Citizen Dashboard
// COMPLETE WORKING VERSION
// ========================================

const API_BASE_URL = 'http://localhost:8080/api';

let selectedLat = null;
let selectedLng = null;
let map = null;
let marker = null;
let capturedImageBlob = null;
let cameraStream = null;

// ========================================
// INITIALIZE - Authentication Check
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard starting...');
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
        console.log('❌ Not logged in');
        window.location.href = 'signin.html';
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        console.log('✅ Logged in as:', user.name);
        
        // Update UI with user info
        document.getElementById('citizenName').textContent = user.name || 'Citizen';
        
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profilePhone = document.getElementById('profilePhone');
        
        if (profileName) profileName.textContent = user.name || 'User';
        if (profileEmail) profileEmail.textContent = user.email || 'N/A';
        if (profilePhone) profilePhone.textContent = user.phone || 'N/A';
        
        // Setup page
        setupNavigation();
        setupForm();
        setupImageUpload();
        
        // Load data - FIXED FUNCTION NAME
        loadDashboardStats();
        loadRecentReports();
        loadAllReports();
        
        console.log('✅ Dashboard ready!');
        
    } catch (err) {
        console.error('Error:', err);
        window.location.href = 'signin.html';
    }
});

// ========================================
// NAVIGATION
// ========================================
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            
            this.classList.add('active');
            const section = this.getAttribute('data-section');
            document.getElementById(`${section}-section`).classList.add('active');
        });
    });
}

function showReportSection() {
    document.querySelector('[data-section="report"]').click();
}

// ========================================
// LOAD STATISTICS
// ========================================
async function loadDashboardStats() {
    console.log('🔍 Loading stats...');
    
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            console.error('No user found');
            return;
        }
        
        const url = `${API_BASE_URL}/grievances/citizen/${user.id}`;
        console.log('Fetching:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error('Response not OK:', response.status);
            return;
        }
        
        // Read response as text first to debug
        const text = await response.text();
        console.log('Raw response length:', text.length);
        
        // Parse JSON
        let grievances;
        try {
            grievances = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.log('Response text:', text.substring(0, 500)); // Show first 500 chars
            return;
        }
        
        console.log('✅ Parsed grievances:', grievances);
        
        // Calculate stats
        const total = Array.isArray(grievances) ? grievances.length : 0;
        const pending = Array.isArray(grievances) ? grievances.filter(g => g.status === 'PENDING').length : 0;
        const inProgress = Array.isArray(grievances) ? grievances.filter(g => g.status === 'IN_PROGRESS').length : 0;
        const resolved = Array.isArray(grievances) ? grievances.filter(g => g.status === 'RESOLVED').length : 0;
        
        console.log('Stats:', { total, pending, inProgress, resolved });
        
        // Update DOM
        const totalEl = document.getElementById('totalReports');
        const pendingEl = document.getElementById('pendingReports');
        const inProgressEl = document.getElementById('inProgressReports');
        const resolvedEl = document.getElementById('resolvedReports');
        
        if (totalEl) totalEl.textContent = total;
        if (pendingEl) pendingEl.textContent = pending;
        if (inProgressEl) inProgressEl.textContent = inProgress;
        if (resolvedEl) resolvedEl.textContent = resolved;
        
        const profileTotal = document.getElementById('profileTotalReports');
        const profileResolved = document.getElementById('profileResolvedReports');
        
        if (profileTotal) profileTotal.textContent = total;
        if (profileResolved) profileResolved.textContent = resolved;
        
        console.log('✅ Stats updated successfully!');
        
    } catch (error) {
        console.error('❌ Error in loadDashboardStats:', error);
    }
}

// ========================================
// LOAD RECENT REPORTS
// ========================================
async function loadRecentReports() {
    console.log('🔍 Loading recent reports...');
    
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) return;
        
        const response = await fetch(`${API_BASE_URL}/grievances/citizen/${user.id}`);
        
        if (!response.ok) {
            console.error('Response not OK');
            return;
        }
        
        const text = await response.text();
        let grievances;
        
        try {
            grievances = JSON.parse(text);
        } catch (e) {
            console.error('Parse error in recent reports:', e);
            return;
        }
        
        const recentList = document.getElementById('recentReportsList');
        if (!recentList) return;
        
        if (!Array.isArray(grievances) || grievances.length === 0) {
            recentList.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                    <p style="color: #64748b; font-size: 16px; margin-bottom: 16px;">No reports yet</p>
                    <button class="btn btn-primary" onclick="showReportSection()">Submit Your First Report</button>
                </div>
            `;
        } else {
            const recent = grievances.slice(0, 3);
            recentList.innerHTML = recent.map(g => makeCard(g)).join('');
        }
        
        console.log('✅ Recent reports loaded:', grievances.length);
        
    } catch (error) {
        console.error('❌ Error in loadRecentReports:', error);
    }
}

// ========================================
// LOAD ALL MY REPORTS
// ========================================
async function loadAllReports() {
    console.log('🔍 Loading all reports...');
    
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) return;
        
        const response = await fetch(`${API_BASE_URL}/grievances/citizen/${user.id}`);
        
        if (!response.ok) {
            console.error('Response not OK');
            return;
        }
        
        const text = await response.text();
        let reports;
        
        try {
            reports = JSON.parse(text);
        } catch (e) {
            console.error('Parse error in all reports:', e);
            return;
        }
        
        const list = document.getElementById('myReportsList');
        if (!list) return;
        
        if (!Array.isArray(reports) || reports.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 60px; grid-column: 1/-1;">
                    <div style="font-size: 64px;">📋</div>
                    <h3 style="color: #1e293b; margin: 20px 0 8px;">No Reports Found</h3>
                    <p style="color: #64748b; margin-bottom: 24px;">Start by reporting an issue</p>
                    <button class="btn btn-primary" onclick="showReportSection()">Submit New Report</button>
                </div>
            `;
        } else {
            list.innerHTML = reports.map(r => makeDetailCard(r)).join('');
        }
        
        console.log('✅ All reports loaded:', reports.length);
        
    } catch (error) {
        console.error('❌ Error in loadAllReports:', error);
    }}
// ========================================
// CREATE REPORT CARDS
// ========================================
function makeCard(r) {
    const info = getStatus(r.status);
    return `
        <div class="report-card" style="border-left: 4px solid ${info.color};">
            <div class="report-card-header">
                <div>
                    <div class="report-card-title">${clean(r.title)}</div>
                    <div class="report-card-id">ID: ${r.id}</div>
                </div>
                <span class="status-badge" style="background: ${info.color}20; color: ${info.color}; border: 2px solid ${info.color};">
                    ${info.label}
                </span>
            </div>
            <div class="report-card-body">
                <span class="report-card-category">${r.category}</span>
                ${r.description ? `<div class="report-card-description">${clean(r.description.substring(0, 100))}...</div>` : ''}
                <div class="report-card-location">📍 ${clean(r.location)}</div>
            </div>
            <div class="report-card-footer">
                <span class="report-card-date">${formatDate(r.createdAt)}</span>
            </div>
        </div>
    `;
}

function makeDetailCard(r) {
    const info = getStatus(r.status);
    return `
        <div class="report-card" style="border-left: 4px solid ${info.color};">
            <div class="report-card-header">
                <div>
                    <div class="report-card-title">${clean(r.title)}</div>
                    <div class="report-card-id">ID: ${r.id}</div>
                </div>
                <span class="status-badge" style="background: ${info.color}20; color: ${info.color}; border: 2px solid ${info.color};">
                    ${info.label}
                </span>
            </div>
            <div class="report-card-body">
                <span class="report-card-category">${r.category}</span>
                ${r.description ? `<div class="report-card-description">${clean(r.description)}</div>` : ''}
                <div class="report-card-location">📍 ${clean(r.location)}</div>
                ${r.imagePath ? `
                    <div style="margin-top: 12px;">
                        <img src="${API_BASE_URL}/uploads/${r.imagePath}" 
                             alt="Issue" 
                             style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; cursor: pointer;"
                             onclick="openImageModal('${API_BASE_URL}/uploads/${r.imagePath}')"
                             onerror="this.style.display='none'">
                    </div>
                ` : ''}
            </div>
            <div class="report-card-footer">
                <span class="report-card-date">📅 ${formatDate(r.createdAt)}</span>
            </div>
        </div>
    `;
}

function getStatus(status) {
    const map = {
        'PENDING': { color: '#f59e0b', label: 'Pending' },
        'IN_PROGRESS': { color: '#3b82f6', label: 'In Progress' },
        'RESOLVED': { color: '#10b981', label: 'Resolved' }
    };
    return map[status] || { color: '#64748b', label: status };
}

// ========================================
// FILTER REPORTS
// ========================================
async function filterReports() {
    const status = document.getElementById('statusFilter').value;
    const category = document.getElementById('categoryFilter').value;
    
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        const res = await fetch(`${API_BASE_URL}/grievances/citizen/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            let reports = await res.json();
            
            if (status !== 'all') {
                reports = reports.filter(r => r.status === status);
            }
            if (category !== 'all') {
                reports = reports.filter(r => r.category === category);
            }
            
            const list = document.getElementById('myReportsList');
            if (reports.length === 0) {
                list.innerHTML = '<p style="text-align:center; padding:40px; color:#64748b; grid-column: 1/-1;">No reports match filters</p>';
            } else {
                list.innerHTML = reports.map(r => makeDetailCard(r)).join('');
            }
        }
    } catch (err) {
        console.error('Filter error:', err);
    }
}

// ========================================
// SEARCH BY ID
// ========================================
async function searchReport() {
    const query = document.getElementById('searchQuery').value.trim();
    
    if (!query) {
        alert('Enter Report ID');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/grievances/${query}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const results = document.getElementById('trackResults');
        
        if (res.ok) {
            const report = await res.json();
            results.innerHTML = makeDetailCard(report);
        } else if (res.status === 404) {
            results.innerHTML = `<p style="text-align:center; padding:40px; color:#ef4444;">Report ID "${clean(query)}" not found</p>`;
        } else {
            results.innerHTML = '<p style="text-align:center; padding:40px; color:#ef4444;">Error searching</p>';
        }
    } catch (err) {
        console.error('Search error:', err);
        alert('Network error');
    }
}

// ========================================
// FORM SETUP
// ========================================
function setupForm() {
    const form = document.getElementById('reportForm');
    if (form) {
        form.addEventListener('submit', submitReport);
        const desc = document.getElementById('reportDescription');
        if (desc) desc.removeAttribute('required');
    }
}

// ========================================
// SUBMIT REPORT
// ========================================
async function submitReport(e) {
    e.preventDefault();
    
    const btn = document.getElementById('submitBtn');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Submitting...';
    
    try {
        const title = document.getElementById('reportTitle').value.trim();
        const category = document.getElementById('reportCategory').value;
        const location = document.getElementById('reportLocation').value.trim();
        const description = document.getElementById('reportDescription').value.trim();
        const photoInput = document.getElementById('reportPhoto');
        
        if (!title || !category || !location) {
            alert('Fill all required fields');
            btn.disabled = false;
            btn.innerHTML = orig;
            return;
        }
        
        if (!capturedImageBlob && photoInput.files.length === 0) {
            alert('Upload or capture a photo');
            btn.disabled = false;
            btn.innerHTML = orig;
            return;
        }
        
        const data = new FormData();
        const user = JSON.parse(localStorage.getItem('user'));
        
        data.append('title', title);
        data.append('category', category);
        data.append('location', location);
        data.append('description', description || '');
        data.append('citizenId', user.id);
        data.append('status', 'PENDING');
        
        if (selectedLat && selectedLng) {
            data.append('latitude', selectedLat);
            data.append('longitude', selectedLng);
        }
        
        if (capturedImageBlob) {
            data.append('image', capturedImageBlob, 'photo.jpg');
        } else if (photoInput.files.length > 0) {
            const file = photoInput.files[0];
            
            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be under 5MB');
                btn.disabled = false;
                btn.innerHTML = orig;
                return;
            }
            
            const types = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!types.includes(file.type)) {
                alert('Only JPG/PNG allowed');
                btn.disabled = false;
                btn.innerHTML = orig;
                return;
            }
            
            data.append('image', file);
        }
        
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/grievances`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: data
        });
        
        if (res.ok) {
            const result = await res.json();
            alert(`✅ Report submitted!\n\nID: ${result.id}\n\nCheck "My Reports" section.`);
            
            document.getElementById('reportForm').reset();
            document.getElementById('imagePreview').innerHTML = '';
            selectedLat = null;
            selectedLng = null;
            capturedImageBlob = null;
            
            setTimeout(() => {
                loadDashboardStats();
                loadRecentReports();
                loadAllReports();
                document.querySelector('[data-section="my-reports"]').click();
            }, 1000);
            
        } else {
            const err = await res.text();
            alert('❌ Submit failed: ' + err);
        }
        
    } catch (err) {
        console.error('Submit error:', err);
        alert('❌ Network error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = orig;
    }
}

// ========================================
// IMAGE UPLOAD
// ========================================
function setupImageUpload() {
    const input = document.getElementById('reportPhoto');
    
    if (input) {
        input.removeAttribute('required');
        
        const cameraBtn = document.createElement('button');
        cameraBtn.type = 'button';
        cameraBtn.className = 'btn btn-secondary';
        cameraBtn.style.cssText = 'margin-top: 8px; margin-left: 8px;';
        cameraBtn.innerHTML = '📷 Capture Photo';
        cameraBtn.onclick = openCamera;
        
        input.parentElement.insertBefore(cameraBtn, input.nextSibling);
        
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                capturedImageBlob = null;
                previewImage(file);
            }
        });
    }
}

function previewImage(file) {
    const preview = document.getElementById('imagePreview');
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB');
        document.getElementById('reportPhoto').value = '';
        return;
    }
    
    const types = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!types.includes(file.type)) {
        alert('Only JPG/PNG allowed');
        document.getElementById('reportPhoto').value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `
            <div style="position: relative; display: inline-block; margin-top: 10px;">
                <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                <button type="button" onclick="removeImage()" style="position: absolute; top: -8px; right: -8px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;">×</button>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    document.getElementById('reportPhoto').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    capturedImageBlob = null;
}

// ========================================
// CAMERA
// ========================================
function openCamera() {
    const modal = document.createElement('div');
    modal.id = 'cameraModal';
    modal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2000; align-items: center; justify-content: center;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 24px; max-width: 640px; width: 90%;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <h3>📷 Capture Photo</h3>
                <button onclick="closeCamera()" style="background: none; border: none; font-size: 28px; cursor: pointer;">&times;</button>
            </div>
            <video id="cameraVideo" autoplay playsinline style="width: 100%; border-radius: 8px; background: #000;"></video>
            <canvas id="cameraCanvas" style="display: none;"></canvas>
            <div id="cameraError" style="margin-top: 12px; padding: 12px; background: #fee2e2; color: #991b1b; border-radius: 8px; display: none;"></div>
            <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: center;">
                <button class="btn btn-secondary" onclick="closeCamera()">Cancel</button>
                <button class="btn btn-primary" onclick="capturePhoto()">📷 Capture</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(startCamera, 100);
}

async function startCamera() {
    try {
        const video = document.getElementById('cameraVideo');
        if (!video) return;
        
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        
        video.srcObject = cameraStream;
        console.log('✅ Camera started');
        
    } catch (err) {
        console.error('Camera error:', err);
        const errorDiv = document.getElementById('cameraError');
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.innerHTML = '❌ Camera access denied';
        }
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(function(blob) {
        capturedImageBlob = blob;
        
        const preview = document.getElementById('imagePreview');
        const url = URL.createObjectURL(blob);
        preview.innerHTML = `
            <div style="position: relative; display: inline-block; margin-top: 10px;">
                <img src="${url}" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid #10b981;">
                <button type="button" onclick="removeImage()" style="position: absolute; top: -8px; right: -8px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;">×</button>
            </div>
        `;
        
        document.getElementById('reportPhoto').value = '';
        closeCamera();
        alert('✅ Photo captured!');
    }, 'image/jpeg', 0.9);
}

function closeCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    
    const modal = document.getElementById('cameraModal');
    if (modal) modal.remove();
}

// ========================================
// MAP
// ========================================
function openMapPicker() {
    const modal = document.getElementById('mapModal');
    if (!modal) return;
    
    modal.style.display = 'block';
    
    if (!map) {
        setTimeout(() => {
            map = L.map('map').setView([30.7333, 76.7794], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(map);
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    map.setView([lat, lng], 15);
                    
                    if (marker) map.removeLayer(marker);
                    marker = L.marker([lat, lng]).addTo(map);
                    selectedLat = lat;
                    selectedLng = lng;
                    
                    getAddress(lat, lng);
                });
            }
            
            map.on('click', function(e) {
                if (marker) map.removeLayer(marker);
                marker = L.marker(e.latlng).addTo(map);
                selectedLat = e.latlng.lat;
                selectedLng = e.latlng.lng;
                getAddress(selectedLat, selectedLng);
            });
        }, 300);
    } else {
        setTimeout(() => map.invalidateSize(), 100);
    }
}

async function getAddress(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        if (data.display_name) {
            document.getElementById('reportLocation').value = data.display_name;
        }
    } catch (err) {
        console.error('Geocode error:', err);
    }
}

function closeMapPicker() {
    document.getElementById('mapModal').style.display = 'none';
}

function confirmLocation() {
    if (!selectedLat || !selectedLng) {
        alert('Select a location first');
        return;
    }
    
    document.getElementById('reportLatitude').value = selectedLat;
    document.getElementById('reportLongitude').value = selectedLng;
    closeMapPicker();
    alert('✅ Location selected!');
}

// ========================================
// UTILITIES
// ========================================
function formatDate(str) {
    const date = new Date(str);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function clean(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function openImageModal(src) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div style="position: relative;">
            <img src="${src}" style="max-width: 90vw; max-height: 90vh; border-radius: 8px;">
            <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: -40px; right: 0; background: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 24px;">×</button>
        </div>
    `;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
}

function handleLogout() {
    if (confirm('Logout?')) {
        localStorage.clear();
        window.location.href = 'signin.html';
    }
}

// Profile edit functions
function showEditForm() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    document.getElementById('edit-name').value = user.name;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-phone').value = user.phone;
    
    document.getElementById('view-mode').style.display = 'none';
    document.getElementById('edit-mode').style.display = 'block';
}

function cancelEdit() {
    document.getElementById('view-mode').style.display = 'block';
    document.getElementById('edit-mode').style.display = 'none';
}

async function updateProfile(event) {
    event.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user.id;
    
    const data = {
        name: document.getElementById('edit-name').value,
        email: document.getElementById('edit-email').value,
        phone: document.getElementById('edit-phone').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Failed');
        
        const updated = await response.json();
        localStorage.setItem('user', JSON.stringify(updated));
        
        document.getElementById('display-name').textContent = updated.name;
        document.getElementById('display-email').textContent = updated.email;
        document.getElementById('display-phone').textContent = updated.phone;
        
        cancelEdit();
        alert('✅ Profile updated!');
        
    } catch (error) {
        alert('❌ Failed to update profile!');
        console.error(error);
    }
}

console.log('✅ Dashboard loaded!');