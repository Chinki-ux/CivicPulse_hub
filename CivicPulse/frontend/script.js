// ========================================
// CivicPulse Hub - Authentication Script
// FINAL WORKING VERSION
// ========================================

// API Base URL
const API_URL = 'http://localhost:8080/api/auth';

// ========================================
// REGISTER USER FUNCTION
// ========================================
function registerUser(event) {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('errorMessage');

    // Clear previous errors
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');

    // Validation: Check if passwords match
    if (password !== confirmPassword) {
        showError('errorMessage', 'Passwords do not match!');
        return;
    }

    // Validation: Check password length
    if (password.length < 6) {
        showError('errorMessage', 'Password must be at least 6 characters!');
        return;
    }

    // Validation: Check phone number (10 digits)
    if (phone.length !== 10 || isNaN(phone)) {
        showError('errorMessage', 'Please enter valid 10-digit phone number!');
        return;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    // Prepare data for backend
const role = document.getElementById('role').value;

const userData = {
    name: name,
    email: email,
    phone: phone,
    password: password,
    role: role
};
    console.log('Sending registration data:', userData);

    // Send POST request to backend
    fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Registration response:', data);
        
        if (data.message && data.message.includes('successful')) {
            alert('✅ ' + data.message);
            window.location.href = 'signin.html';
        } else {
            showError('errorMessage', data.message || 'Registration failed');
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        showError('errorMessage', 'Cannot connect to server. Is Spring Boot running on port 8080?');
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    });
}

// ========================================
// LOGIN USER FUNCTION
// ========================================
// ========================================
// LOGIN USER FUNCTION - FIXED
// ========================================
function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const selectedRole = document.getElementById('role').value; // ✅ FORM SE ROLE LO
    const errorMessage = document.getElementById('loginErrorMessage');

    errorMessage.textContent = '';
    errorMessage.classList.remove('show');

    if (!email || !password) {
        showError('loginErrorMessage', 'Please enter email and password!');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    const loginData = {
        email: email,
        password: password
    };

    console.log('📤 Login request:', loginData);
    console.log('📋 Selected role from dropdown:', selectedRole);

    fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('📥 Backend response:', data);
        
        if (data.token && data.user) {
            console.log('✅ Login successful!');
            console.log('Backend role:', data.user.role);
            console.log('Frontend selected role:', selectedRole);
            
            // ✅ CHECK: Backend role matches frontend selection
            const backendRole = data.user.role.toUpperCase();
            const frontendRole = selectedRole.toUpperCase();
            
            if (backendRole !== frontendRole) {
                showError('loginErrorMessage', `❌ You selected ${frontendRole} but you are registered as ${backendRole}. Please select correct role.`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
                return;
            }
            
            // Save to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            alert('✅ Login successful!');
            
            console.log('🔄 Redirecting to:', frontendRole, 'dashboard');
            
            // ✅ USE FRONTEND SELECTED ROLE
            setTimeout(() => {
                if (frontendRole === 'CITIZEN') {
                    window.location.href = 'citizen-dashboard.html';
                } else if (frontendRole === 'ADMIN') {
                    window.location.href = 'admin-dashboard.html';
                } else if (frontendRole === 'OFFICER') {
                    window.location.href = 'officer-dashboard.html';
                } else {
                    window.location.href = 'citizen-dashboard.html';
                }
            }, 500);
        } else {
            showError('loginErrorMessage', data.message || 'Login failed!');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    })
    .catch(error => {
        console.error('❌ Error:', error);
        showError('loginErrorMessage', 'Cannot connect to server!');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    });
}
// ========================================
// HELPER: Show Error Message
// ========================================
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorElement.classList.remove('show');
    }, 5000);
}

// ========================================
// HELPER: Check if logged in
// ========================================
function isLoggedIn() {
    const token = localStorage.getItem('token');
    return token !== null;
}

// ========================================
// HELPER: Get current user
// ========================================
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// ========================================
// HELPER: Get user role
// ========================================
function getUserRole() {
    return localStorage.getItem('userRole');
}

// ========================================
// HELPER: Logout function
// ========================================
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    alert('Logged out successfully!');
    window.location.href = 'signin.html';
}