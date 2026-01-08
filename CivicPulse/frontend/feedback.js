// ========================================
// FEEDBACK & RATING SYSTEM - JavaScript
// ========================================

const API_URL = 'http://localhost:8080/api';

let selectedRating = 0;
let currentGrievanceId = null;
let currentUser = null;

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌟 Feedback System Loading...');
    
    // Get current user
    currentUser = getCurrentUser();
    
    if (!currentUser) {
        alert('⚠️ Please login first!');
        window.location.href = 'signin.html';
        return;
    }
    
    // Get grievance ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentGrievanceId = urlParams.get('grievanceId');
    
    if (!currentGrievanceId) {
        alert('❌ No complaint ID provided!');
        window.location.href = 'citizen-dashboard.html';
        return;
    }
    
    // Setup event listeners
    setupStarRating();
    setupCharCounter();
    setupFormSubmission();
    setupReopenButton();
    
    // Load grievance details
    loadGrievanceDetails();
    
    // Check if feedback already submitted
    checkExistingFeedback();
    
    console.log('✅ Feedback System initialized!');
});

// ========================================
// GET CURRENT USER
// ========================================
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// ========================================
// LOAD GRIEVANCE DETAILS
// ========================================
async function loadGrievanceDetails() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/grievances/${currentGrievanceId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load complaint details');
        }
        
        const grievance = await response.json();
        
        // Update UI with grievance details
        document.getElementById('complaintId').textContent = `CMP-${grievance.id}`;
        document.getElementById('complaintTitle').textContent = grievance.title || 'N/A';
        document.getElementById('complaintStatus').textContent = 
            grievance.status === 'RESOLVED' ? '✅ Resolved' : grievance.status;
        
        if (grievance.resolvedAt) {
            document.getElementById('resolvedDate').textContent = formatDate(grievance.resolvedAt);
        }
        
        // Check if complaint is resolved
        if (grievance.status !== 'RESOLVED') {
            alert('⚠️ Feedback can only be submitted for resolved complaints!');
            window.location.href = 'citizen-dashboard.html';
            return;
        }
        
        console.log('✅ Grievance details loaded:', grievance);
        
    } catch (error) {
        console.error('❌ Error loading grievance:', error);
        alert('Failed to load complaint details. Please try again.');
        window.location.href = 'citizen-dashboard.html';
    }
}

// ========================================
// CHECK EXISTING FEEDBACK
// ========================================
async function checkExistingFeedback() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/feedback/grievance/${currentGrievanceId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const feedback = await response.json();
            
            // Show already submitted message
            document.getElementById('feedbackForm').style.display = 'none';
            document.querySelector('.rating-section').style.display = 'none';
            document.getElementById('alreadySubmitted').style.display = 'block';
            
            // Display previous feedback
            const previousFeedbackDiv = document.getElementById('previousFeedback');
            previousFeedbackDiv.innerHTML = `
                <div class="rating-display">
                    Rating: ${'⭐'.repeat(feedback.rating)} (${feedback.rating}/5)
                </div>
                ${feedback.comment ? `
                    <div class="comment-display">
                        <strong>Your Comment:</strong><br>
                        "${feedback.comment}"
                    </div>
                ` : ''}
                <p style="margin-top: 15px; color: #666; font-size: 14px;">
                    Submitted on: ${formatDate(feedback.createdAt)}
                </p>
            `;
            
            console.log('ℹ️ Feedback already submitted');
        }
        
    } catch (error) {
        // No feedback exists yet - this is normal
        console.log('No existing feedback found');
    }
}

// ========================================
// SETUP STAR RATING
// ========================================
function setupStarRating() {
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('ratingText');
    
    const ratingLabels = {
        1: 'Very Dissatisfied 😞',
        2: 'Dissatisfied 😕',
        3: 'Neutral 😐',
        4: 'Satisfied 🙂',
        5: 'Very Satisfied 😄'
    };
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.getAttribute('data-rating'));
            
            // Update star appearance
            stars.forEach(s => {
                const starRating = parseInt(s.getAttribute('data-rating'));
                if (starRating <= selectedRating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
            
            // Update rating text
            ratingText.textContent = ratingLabels[selectedRating];
            
            console.log('⭐ Rating selected:', selectedRating);
        });
        
        // Hover effect
        star.addEventListener('mouseenter', function() {
            const hoverRating = parseInt(this.getAttribute('data-rating'));
            stars.forEach(s => {
                const starRating = parseInt(s.getAttribute('data-rating'));
                if (starRating <= hoverRating) {
                    s.style.filter = 'grayscale(0%)';
                    s.style.opacity = '1';
                } else {
                    s.style.filter = 'grayscale(100%)';
                    s.style.opacity = '0.4';
                }
            });
        });
    });
    
    // Reset on mouse leave
    document.getElementById('starRating').addEventListener('mouseleave', function() {
        stars.forEach(s => {
            const starRating = parseInt(s.getAttribute('data-rating'));
            if (starRating <= selectedRating) {
                s.style.filter = 'grayscale(0%)';
                s.style.opacity = '1';
            } else {
                s.style.filter = 'grayscale(100%)';
                s.style.opacity = '0.4';
            }
        });
    });
}

// ========================================
// SETUP CHARACTER COUNTER
// ========================================
function setupCharCounter() {
    const textarea = document.getElementById('feedbackComment');
    const charCount = document.getElementById('charCount');
    
    textarea.addEventListener('input', function() {
        charCount.textContent = this.value.length;
    });
}

// ========================================
// SETUP FORM SUBMISSION
// ========================================
function setupFormSubmission() {
    const form = document.getElementById('feedbackForm');
    const submitBtn = document.getElementById('submitBtn');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate rating
        if (selectedRating === 0) {
            alert('⚠️ Please select a rating before submitting!');
            return;
        }
        
        const comment = document.getElementById('feedbackComment').value.trim();
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
        
        try {
            await submitFeedback(selectedRating, comment);
        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-icon">✓</span> Submit Feedback';
        }
    });
}

// ========================================
// SUBMIT FEEDBACK
// ========================================
async function submitFeedback(rating, comment) {
    try {
        const token = localStorage.getItem('token');
        
        const feedbackData = {
            grievanceId: parseInt(currentGrievanceId),
            userId: currentUser.id,
            rating: rating,
            comment: comment || null
        };
        
        console.log('📤 Submitting feedback:', feedbackData);
        
        const response = await fetch(`${API_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(feedbackData)
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }
        
        const result = await response.json();
        console.log('✅ Feedback submitted successfully:', result);
        
        // Hide form and show success message
        document.getElementById('feedbackForm').style.display = 'none';
        document.querySelector('.rating-section').style.display = 'none';
        document.querySelector('.status-section').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Error submitting feedback:', error);
        alert('Failed to submit feedback: ' + error.message);
        throw error;
    }
}

// ========================================
// SETUP REOPEN BUTTON
// ========================================
function setupReopenButton() {
    const reopenBtn = document.getElementById('reopenBtn');
    
    reopenBtn.addEventListener('click', async function() {
        // Warn if rating is high
        if (selectedRating >= 4) {
            if (!confirm('You selected a high rating. Are you sure you want to reopen this complaint?')) {
                return;
            }
        }
        
        const reason = prompt('Please provide a reason for reopening this complaint:');
        
        if (!reason || reason.trim() === '') {
            alert('⚠️ Please provide a reason to reopen the complaint!');
            return;
        }
        
        reopenBtn.disabled = true;
        reopenBtn.innerHTML = '<span class="spinner"></span> Reopening...';
        
        try {
            await reopenComplaint(reason);
        } catch (error) {
            reopenBtn.disabled = false;
            reopenBtn.innerHTML = '<span class="btn-icon">↻</span> Reopen Complaint';
        }
    });
}

// ========================================
// REOPEN COMPLAINT
// ========================================
async function reopenComplaint(reason) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(
            `${API_URL}/feedback/reopen/${currentGrievanceId}?userId=${currentUser.id}&reason=${encodeURIComponent(reason)}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }
        
        const result = await response.json();
        console.log('✅ Complaint reopened:', result);
        
        alert('✅ Complaint reopened successfully! It will be reviewed again.');
        window.location.href = 'citizen-dashboard.html';
        
    } catch (error) {
        console.error('❌ Error reopening complaint:', error);
        alert('Failed to reopen complaint: ' + error.message);
        throw error;
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

console.log('✅ Feedback System Script Loaded!');