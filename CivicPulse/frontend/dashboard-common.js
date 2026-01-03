// ========================================
// CivicPulse Hub - Citizen Dashboard
// Grievance Submission Module
// ========================================

// API Base URL - Change this according to your backend
const API_BASE_URL = 'http://localhost:8080/api';

// Global Variables
let selectedLat = null;
let selectedLng = null;
let map = null;
let marker = null;
let capturedImageBlob = null;

// ========================================
// INITIALIZE ON PAGE LOAD
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    loadRecentReports();
    loadMyReports();
    setupFormHandlers();
    setupImageUpload();
});

// ========================================
// LOAD DASHBOARD STATISTICS
// ========================================
async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) {
            window.location.href = 'signin.html';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/complaints/citizen/${user.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const complaints = await response.json();
            
            // Calculate statistics
            const total = complaints.length;
            const pending = complaints.filter(c => c.status === 'PENDING').length;
            const inProgress = complaints.filter(c => c.status === 'IN_PROGRESS').length;
            const resolved = complaints.filter(c => c.status === 'RESOLVED').length;
            
            // Update stats cards
            document.getElementById('totalReports').textContent = total;
            document.getElementById('pendingReports').textContent = pending;
            document.getElementById('inProgressReports').textContent = inProgress;
            document.getElementById('resolvedReports').textContent = resolved;
            
            // Update profile stats
            document.getElementById('profileTotalReports').textContent = total;
            document.getElementById('profileResolvedReports').textContent = resolved;
            
        } else if (response.status === 401) {
            alert('Session expired. Please login again.');
            localStorage.clear();
            window.location.href = 'signin.html';
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// ========================================
// LOAD RECENT REPORTS (Top 5)
// ========================================
async function loadRecentReports() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        const response = await fetch(`${API_BASE_URL}/complaints/citizen/${user.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const complaints = await response.json();
            const recentList = document.getElementById('recentReportsList');
            
            if (complaints.length === 0) {
                recentList.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 20px;">No reports yet. Submit your first complaint!</p>';
                return;
            }
            
            // Sort by created date (newest first) and take top 5
            const recent = complaints
                .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
                .slice(0, 5);
            
            recentList.innerHTML = recent.map(complaint => createReportCard(complaint)).join('');
        }
    } catch (error) {
        console.error('Error loading recent reports:', error);
        document.getElementById('recentReportsList').innerHTML = 
            '<p style="text-align: center; color: #ef4444; padding: 20px;">Error loading reports</p>';
    }
}

// ========================================
// LOAD ALL MY REPORTS
// ========================================
async function loadMyReports() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        const response = await fetch(`${API_BASE_URL}/complaints/citizen/${user.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const complaints = await response.json();
            displayMyReports(complaints);
        }
    } catch (error) {
        console.error('Error loading my reports:', error);
        document.getElementById('myReportsList').innerHTML = 
            '<p style="text-align: center; color: #ef4444; padding: 40px; grid-column: 1/-1;">Error loading reports</p>';
    }
}

// ========================================
// DISPLAY MY REPORTS
// ========================================
function displayMyReports(complaints) {
    const myReportsList = document.getElementById('myReportsList');
    
    if (complaints.length === 0) {
        myReportsList.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 40px; grid-column: 1/-1;">No reports found</p>';
        return;
    }
    
    myReportsList.innerHTML = complaints
        .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
        .map(complaint => createDetailedReportCard(complaint))
        .join('');
}

// ========================================
// CREATE REPORT CARD (Simple)
// ========================================
function createReportCard(complaint) {
    const statusClass = complaint.status.toLowerCase().replace('_', '-');
    const statusDisplay = complaint.status.replace('_', ' ');
    
    return `
        <div class="report-card ${statusClass}">
            <div class="report-card-header">
                <div>
                    <div class="report-card-title">${complaint.title}</div>
                    <div class="report-card-id">ID: ${complaint.complaintId || complaint.id}</div>
                </div>
                <span class="status-badge ${statusClass}">${statusDisplay}</span>
            </div>
            <div class="report-card-body">
                <span class="report-card-category">${complaint.category}</span>
                <div class="report-card-description">${complaint.description.substring(0, 100)}...</div>
                <div class="report-card-location">📍 ${complaint.location}</div>
            </div>
            <div class="report-card-footer">
                <span class="report-card-date">${formatDate(complaint.createdDate)}</span>
            </div>
        </div>
    `;
}

// ========================================
// CREATE DETAILED REPORT CARD
// ========================================
function createDetailedReportCard(complaint) {
    const statusClass = complaint.status.toLowerCase().replace('_', '-');
    const statusDisplay = complaint.status.replace('_', ' ');
    
    return `
        <div class="report-card ${statusClass}">
            <div class="report-card-header">
                <div>
                    <div class="report-card-title">${complaint.title}</div>
                    <div class="report-card-id">ID: ${complaint.complaintId || complaint.id}</div>
                </div>
                <span class="status-badge ${statusClass}">${statusDisplay}</span>
            </div>
            <div class="report-card-body">
                <span class="report-card-category">${complaint.category}</span>
                <div class="report-card-description">${complaint.description}</div>
                <div class="report-card-location">📍 ${complaint.location}</div>
                ${complaint.imagePath ? `
                    <div style="margin-top: 12px;">
                        <img src="${API_BASE_URL}/uploads/${complaint.imagePath}" 
                             alt="Complaint Image" 
                             style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; cursor: pointer;"
                             onclick="window.open(this.src, '_blank')">
                    </div>
                ` : ''}
            </div>
            <div class="report-card-footer">
                <span class="report-card-date">📅 ${formatDate(complaint.createdDate)}</span>
                <button class="btn btn-secondary" onclick="viewComplaintDetails(${complaint.id})">
                    View Details
                </button>
            </div>
        </div>
    `;
}

// ========================================
// FILTER REPORTS
// ========================================
async function filterReports() {
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        const response = await fetch(`${API_BASE_URL}/complaints/citizen/${user.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            let complaints = await response.json();
            
            // Apply filters
            if (statusFilter !== 'all') {
                complaints = complaints.filter(c => c.status === statusFilter);
            }
            
            if (categoryFilter !== 'all') {
                complaints = complaints.filter(c => c.category === categoryFilter);
            }
            
            displayMyReports(complaints);
        }
    } catch (error) {
        console.error('Error filtering reports:', error);
    }
}

// ========================================
// SEARCH REPORT BY ID
// ========================================
async function searchReport() {
    const searchQuery = document.getElementById('searchQuery').value.trim();
    
    if (!searchQuery) {
        alert('Please enter a Report ID');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/complaints/${searchQuery}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const trackResults = document.getElementById('trackResults');
        
        if (response.ok) {
            const complaint = await response.json();
            trackResults.innerHTML = createDetailedReportCard(complaint);
        } else if (response.status === 404) {
            trackResults.innerHTML = `
                <div class="alert error">
                    <span>⚠️</span>
                    <span>Report ID "${searchQuery}" not found</span>
                </div>
            `;
        } else {
            trackResults.innerHTML = `
                <div class="alert error">
                    <span>❌</span>
                    <span>Error searching report. Please try again.</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error searching report:', error);
        document.getElementById('trackResults').innerHTML = `
            <div class="alert error">
                <span>❌</span>
                <span>Network error. Please check your connection.</span>
            </div>
        `;
    }
}

// ========================================
// SETUP FORM HANDLERS
// ========================================
function setupFormHandlers() {
    const reportForm = document.getElementById('reportForm');
    
    if (reportForm) {
        reportForm.addEventListener('submit', handleReportSubmit);
    }
}

// ========================================
// HANDLE REPORT SUBMISSION
// ========================================
async function handleReportSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Submitting...';
    
    try {
        // Get form data
        const title = document.getElementById('reportTitle').value.trim();
        const category = document.getElementById('reportCategory').value;
        const location = document.getElementById('reportLocation').value.trim();
        const description = document.getElementById('reportDescription').value.trim();
        const photoInput = document.getElementById('reportPhoto');
        
        // Validation
        if (!title || !category || !location || !description) {
            alert('Please fill all required fields');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Report';
            return;
        }
        
        // Check for duplicate (client-side warning)
        if (await isDuplicateComplaint(title, location)) {
            const proceed = confirm('A similar complaint was submitted recently. Do you still want to submit?');
            if (!proceed) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Submit Report';
                return;
            }
        }
        
        // Prepare FormData
        const formData = new FormData();
        const user = JSON.parse(localStorage.getItem('user'));
        
        formData.append('title', title);
        formData.append('category', category);
        formData.append('location', location);
        formData.append('description', description);
        formData.append('citizenId', user.id);
        formData.append('status', 'PENDING');
        
        // Add coordinates if available
        if (selectedLat && selectedLng) {
            formData.append('latitude', selectedLat);
            formData.append('longitude', selectedLng);
        }
        
        // Add image file (from file input or captured camera)
        if (capturedImageBlob) {
            formData.append('image', capturedImageBlob, 'captured-image.jpg');
        } else if (photoInput.files.length > 0) {
            const file = photoInput.files[0];
            
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size must be less than 5MB');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Submit Report';
                return;
            }
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                alert('Only JPG, JPEG, and PNG files are allowed');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Submit Report';
                return;
            }
            
            formData.append('image', file);
        } else {
            alert('Please upload a photo of the issue');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Report';
            return;
        }
        
        // Submit to API
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/complaints`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Show success message
            alert(`✅ Complaint submitted successfully!\n\nComplaint ID: ${result.complaintId || result.id}\n\nYou can track its status in "My Reports" section.`);
            
            // Reset form
            document.getElementById('reportForm').reset();
            document.getElementById('imagePreview').innerHTML = '';
            selectedLat = null;
            selectedLng = null;
            capturedImageBlob = null;
            
            // Reload dashboard
            loadDashboardStats();
            loadRecentReports();
            loadMyReports();
            
            // Navigate to My Reports
            document.querySelector('[data-section="my-reports"]').click();
            
        } else if (response.status === 401) {
            alert('Session expired. Please login again.');
            localStorage.clear();
            window.location.href = 'signin.html';
        } else {
            const error = await response.json();
            alert(`❌ Error: ${error.message || 'Failed to submit complaint'}`);
        }
        
    } catch (error) {
        console.error('Error submitting report:', error);
        alert('❌ Network error. Please check your connection and try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Report';
    }
}

// ========================================
// CHECK DUPLICATE COMPLAINT
// ========================================
async function isDuplicateComplaint(title, location) {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        const response = await fetch(`${API_BASE_URL}/complaints/citizen/${user.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const complaints = await response.json();
            
            // Check for similar complaint in last 24 hours
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const duplicate = complaints.some(c => {
                const createdDate = new Date(c.createdDate);
                return c.title.toLowerCase() === title.toLowerCase() &&
                       c.location.toLowerCase() === location.toLowerCase() &&
                       createdDate > yesterday;
            });
            
            return duplicate;
        }
    } catch (error) {
        console.error('Error checking duplicate:', error);
    }
    return false;
}

// ========================================
// IMAGE UPLOAD & CAMERA SETUP
// ========================================
function setupImageUpload() {
    const photoInput = document.getElementById('reportPhoto');
    const imagePreview = document.getElementById('imagePreview');
    
    if (photoInput) {
        // Change to not required by default (since we can use camera)
        photoInput.removeAttribute('required');
        
        // Add camera button after file input
        const cameraBtn = document.createElement('button');
        cameraBtn.type = 'button';
        cameraBtn.className = 'btn btn-secondary';
        cameraBtn.style.marginTop = '8px';
        cameraBtn.style.marginLeft = '8px';
        cameraBtn.innerHTML = '📷 Capture Photo';
        cameraBtn.onclick = openCamera;
        
        photoInput.parentElement.insertBefore(cameraBtn, photoInput.nextSibling);
        
        // File input change handler
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                previewImage(file);
            }
        });
    }
}

// ========================================
// PREVIEW IMAGE
// ========================================
function previewImage(file) {
    const imagePreview = document.getElementById('imagePreview');
    
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        document.getElementById('reportPhoto').value = '';
        return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, JPEG, and PNG files are allowed');
        document.getElementById('reportPhoto').value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.innerHTML = `
            <div class="image-preview-item">
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="image-preview-remove" onclick="removeImage()">×</button>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

// ========================================
// REMOVE IMAGE
// ========================================
function removeImage() {
    document.getElementById('reportPhoto').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    capturedImageBlob = null;
}

// ========================================
// OPEN CAMERA
// ========================================
function openCamera() {
    const modal = document.createElement('div');
    modal.id = 'cameraModal';
    modal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 2000; align-items: center; justify-content: center;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 20px; max-width: 600px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Capture Photo</h3>
                <button onclick="closeCamera()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
            </div>
            <video id="cameraVideo" autoplay style="width: 100%; border-radius: 8px; background: #000;"></video>
            <canvas id="cameraCanvas" style="display: none;"></canvas>
            <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: center;">
                <button class="btn btn-secondary" onclick="closeCamera()">Cancel</button>
                <button class="btn btn-primary" onclick="capturePhoto()">📷 Capture</button>
            </div>
            <div id="cameraError" style="margin-top: 12px; color: #ef4444; text-align: center; display: none;"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Start camera
    startCamera();
}

// ========================================
// START CAMERA
// ========================================
async function startCamera() {
    try {
        const video = document.getElementById('cameraVideo');
        
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera not supported in this browser');
        }
        
        // Request camera permission
        const constraints = {
            video: {
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        console.log('✅ Camera started successfully');
        
    } catch (error) {
        console.error('Camera error:', error);
        const errorDiv = document.getElementById('cameraError');
        errorDiv.style.display = 'block';
        
        // Show specific error message
        if (error.name === 'NotAllowedError') {
            errorDiv.textContent = '❌ Camera permission denied. Please allow camera access.';
        } else if (error.name === 'NotFoundError') {
            errorDiv.textContent = '❌ No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
            errorDiv.textContent = '❌ Camera is already in use by another application.';
        } else {
            errorDiv.textContent = '❌ Cannot access camera. Please use file upload instead.';
        }
        
        // Add button to retry or close
        errorDiv.innerHTML += '<br><button class="btn btn-secondary" onclick="closeCamera()" style="margin-top: 10px;">Close</button>';
    }
}

// ========================================
// CAPTURE PHOTO
// ========================================
function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const context = canvas.getContext('2d');
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob(function(blob) {
        capturedImageBlob = blob;
        
        // Show preview
        const imagePreview = document.getElementById('imagePreview');
        const imageUrl = URL.createObjectURL(blob);
        imagePreview.innerHTML = `
            <div class="image-preview-item">
                <img src="${imageUrl}" alt="Captured Photo">
                <button type="button" class="image-preview-remove" onclick="removeImage()">×</button>
            </div>
        `;
        
        // Clear file input
        document.getElementById('reportPhoto').value = '';
        
        // Close camera
        closeCamera();
        
        alert('✅ Photo captured successfully!');
    }, 'image/jpeg', 0.9);
}

// ========================================
// CLOSE CAMERA
// ========================================
function closeCamera() {
    const video = document.getElementById('cameraVideo');
    if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
    }
    
    const modal = document.getElementById('cameraModal');
    if (modal) {
        modal.remove();
    }
}

// ========================================
// MAP PICKER FUNCTIONS
// ========================================
function openMapPicker() {
    const mapModal = document.getElementById('mapModal');
    mapModal.style.display = 'block';
    
    // Initialize map if not already initialized
    if (!map) {
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            alert('Map library not loaded. Please refresh the page.');
            closeMapPicker();
            return;
        }
        
        // Wait for modal to render
        setTimeout(() => {
            try {
                // Initialize map with default location (Chandigarh)
                map = L.map('map').setView([30.7333, 76.7794], 13);
                
                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                
                // Try to get user's current location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(position) {
                        const userLat = position.coords.latitude;
                        const userLng = position.coords.longitude;
                        map.setView([userLat, userLng], 15);
                        
                        // Add marker at user's location
                        if (marker) map.removeLayer(marker);
                        marker = L.marker([userLat, userLng]).addTo(map);
                        selectedLat = userLat;
                        selectedLng = userLng;
                        
                        // Get address
                        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json`)
                            .then(res => res.json())
                            .then(data => {
                                if (data.display_name) {
                                    document.getElementById('reportLocation').value = data.display_name;
                                }
                            })
                            .catch(err => console.error('Geocoding error:', err));
                    });
                }
                
                // Click to select location
                map.on('click', function(e) {
                    if (marker) {
                        map.removeLayer(marker);
                    }
                    
                    marker = L.marker(e.latlng).addTo(map);
                    selectedLat = e.latlng.lat;
                    selectedLng = e.latlng.lng;
                    
                    // Reverse geocoding
                    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${selectedLat}&lon=${selectedLng}&format=json`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.display_name) {
                                document.getElementById('reportLocation').value = data.display_name;
                            }
                        })
                        .catch(err => console.error('Geocoding error:', err));
                });
                
            } catch (error) {
                console.error('Map initialization error:', error);
                alert('Error loading map. Please try again.');
                closeMapPicker();
            }
        }, 200);
    } else {
        // Map already initialized, just resize
        setTimeout(() => map.invalidateSize(), 100);
    }
}

function closeMapPicker() {
    document.getElementById('mapModal').style.display = 'none';
}

function confirmLocation() {
    if (!selectedLat || !selectedLng) {
        alert('Please select a location on the map');
        return;
    }
    
    document.getElementById('reportLatitude').value = selectedLat;
    document.getElementById('reportLongitude').value = selectedLng;
    
    closeMapPicker();
    alert('✅ Location selected successfully!');
}

// ========================================
// VIEW COMPLAINT DETAILS
// ========================================
function viewComplaintDetails(complaintId) {
    // Navigate to track section and search
    document.querySelector('[data-section="track"]').click();
    document.getElementById('searchQuery').value = complaintId;
    searchReport();
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

console.log('✅ Citizen Dashboard script loaded successfully');