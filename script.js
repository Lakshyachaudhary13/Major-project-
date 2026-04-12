
const API_BASE = '/api';

let currentUser = null;
let currentTeacher = null;
let allComplaints = [];

async function initPublicURL() {
    try {
        const response = await fetch(`${API_BASE}/public-url`);
        const data = await response.json();

        let urlBanner = document.getElementById('publicUrlBanner');
        if (!urlBanner) {
            urlBanner = document.createElement('div');
            urlBanner.id = 'publicUrlBanner';
            urlBanner.className = 'public-url-banner';
            document.body.insertBefore(urlBanner, document.body.firstChild);
        }

        const isNgrok = data.publicUrl.includes('ngrok');
        urlBanner.innerHTML = `
            <div class="public-url-content">
                <span class="public-url-label">${isNgrok ? '🌐 Public URL' : '💻 Local URL'}:</span>
                <span class="public-url-value" id="publicUrlValue">${data.publicUrl}</span>
                <button class="copy-btn" onclick="copyPublicURL()" title="Copy URL">📋 Copy</button>
                <span class="copy-success" id="copySuccess" style="display:none;">✓ Copied!</span>
            </div>
        `;
    } catch (error) {
        console.log('Could not fetch public URL:', error);
    }
}

function copyPublicURL() {
    const urlElement = document.getElementById('publicUrlValue');
    const successElement = document.getElementById('copySuccess');

    if (urlElement) {
        navigator.clipboard.writeText(urlElement.textContent).then(() => {
            if (successElement) {
                successElement.style.display = 'inline';
                setTimeout(() => {
                    successElement.style.display = 'none';
                }, 2000);
            }
        });
    }
}

window.copyPublicURL = copyPublicURL;

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    };

    const config = { ...defaultOptions, ...options };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'An error occurred');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function checkStudentSession() {
    try {
        const response = await fetch(`${API_BASE}/students/session`, { 
            credentials: 'include' 
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data;
            showStudentDashboard();
        }
    } catch (error) {
        console.log('Not logged in as student');
    }
}

function showStudentDashboard() {
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const dashboardSection = document.getElementById('dashboardSection');

    if (loginSection) loginSection.classList.add('hidden');
    if (registerSection) registerSection.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.remove('hidden');

    loadStudentComplaints();
    loadStudentProfile();
}

function hideStudentDashboard() {
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const dashboardSection = document.getElementById('dashboardSection');

    if (loginSection) loginSection.classList.remove('hidden');
    if (registerSection) registerSection.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.add('hidden');
}

async function loadStudentComplaints() {
    try {
        const response = await fetch(`${API_BASE}/complaints/my`, {
            credentials: 'include'
        });

        if (response.ok) {
            const complaints = await response.json();
            displayStudentComplaints(complaints);
            updateStudentStats(complaints);
        }
    } catch (error) {
        console.error('Error loading complaints:', error);
    }
}

function displayStudentComplaints(complaints) {
    const listElement = document.getElementById('complaintsList');
    if (!listElement) return;

    if (!Array.isArray(complaints)) {
        console.warn('Expected complaints array but got', complaints);
        complaints = [];
    }

    if (complaints.length === 0) {
        listElement.innerHTML = '<p style="text-align: center; color: var(--gray-color);">No complaints yet. Submit your first complaint!</p>';
        return;
    }

    listElement.innerHTML = complaints.map(c => `
        <div class="complaint-card ${c.status}">
            <div class="complaint-header">
                <span class="complaint-type">${c.type.toUpperCase()}</span>
                <span class="complaint-status status-${c.status}">${c.status}</span>
            </div>
            <div class="complaint-meta">
                <span><i class="fas fa-folder"></i> ${c.category}</span>
                <span><i class="fas fa-calendar"></i> ${new Date(c.timestamp).toLocaleDateString()}</span>
            </div>
            <p class="complaint-description">${c.description}</p>
            ${c.resolutionNotes ? `<p class="resolution-notes"><strong>Resolution:</strong> ${c.resolutionNotes}</p>` : ''}
        </div>
    `).join('');
}

function updateStudentStats(complaints) {
    const totalEl = document.getElementById('totalComplaints');
    const pendingEl = document.getElementById('pendingComplaints');
    const resolvedEl = document.getElementById('resolvedComplaints');

    if (totalEl) totalEl.textContent = complaints.length;
    if (pendingEl) pendingEl.textContent = complaints.filter(c => c.status === 'pending' || c.status === 'in-progress').length;
    if (resolvedEl) resolvedEl.textContent = complaints.filter(c => c.status === 'resolved').length;
}

async function loadStudentProfile() {
    try {
        const response = await fetch(`${API_BASE}/students/session`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();

            const nameEl = document.getElementById('profileName');
            const gmailEl = document.getElementById('profileGmail');
            const studentIdEl = document.getElementById('profileStudentId');
            const phoneEl = document.getElementById('profilePhone');

            if (nameEl) nameEl.textContent = data.studentName || '-';
            if (gmailEl) gmailEl.textContent = data.studentGmail || '-';
            if (studentIdEl) studentIdEl.textContent = data.studentId || '-';
            if (phoneEl) phoneEl.textContent = data.studentPhone || '-';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function handleStudentLogin(event) {
    event.preventDefault();

    const gmail = document.getElementById('loginGmail')?.value;
    const studentId = document.getElementById('loginStudentId')?.value;

    if (!gmail || !studentId) {
        showToast('Please enter Gmail and Student ID', 'error');
        return;
    }

    try {
        const data = await apiCall('/students/login', {
            method: 'POST',
            body: JSON.stringify({ gmail, studentId })
        });

        showToast('Login successful!');
        currentUser = data;
        showStudentDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleStudentRegistration(event) {
    event.preventDefault();

    const name = document.getElementById('regName')?.value;
    const gmail = document.getElementById('regGmail')?.value;
    const studentId = document.getElementById('regStudentId')?.value;
    const phone = document.getElementById('regPhone')?.value;

    if (!name || !gmail || !studentId) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    if (!gmail.endsWith('@gmail.com')) {
        showToast('Please use a valid Gmail address', 'error');
        return;
    }

    try {
        const data = await apiCall('/students/register', {
            method: 'POST',
            body: JSON.stringify({ name, gmail, studentId, phone })
        });

        showToast('Registration successful!');
        currentUser = data.student;
        showStudentDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleComplaintSubmission(event) {
    event.preventDefault();

    const type = document.getElementById('complaintType')?.value;
    const category = document.getElementById('complaintCategory')?.value;
    const description = document.getElementById('complaintDescription')?.value;

    if (!type || !category || !description) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    try {
        const data = await apiCall('/complaints', {
            method: 'POST',
            body: JSON.stringify({ type, category, description })
        });

        showToast('Complaint submitted successfully!');

        const form = document.getElementById('complaintForm');
        if (form) form.reset();

        loadStudentComplaints();

        const complaintsTab = document.querySelector('[data-tab="my-complaints"]');
        if (complaintsTab) complaintsTab.click();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleStudentLogout() {
    try {
        await apiCall('/students/logout', { method: 'POST' });
        currentUser = null;
        hideStudentDashboard();
        showToast('Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

async function checkTeacherSession() {
    try {
        const response = await fetch(`${API_BASE}/teachers/session`, { 
            credentials: 'include' 
        });

        if (response.ok) {
            const data = await response.json();
            currentTeacher = data;
            showTeacherDashboard();
        }
    } catch (error) {
        console.log('Not logged in as teacher');
    }
}

function showTeacherDashboard() {
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const dashboardSection = document.getElementById('dashboardSection');

    if (loginSection) loginSection.classList.add('hidden');
    if (registerSection) registerSection.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.remove('hidden');

    loadAllComplaints();
    loadStudents();
}

function hideTeacherDashboard() {
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const dashboardSection = document.getElementById('dashboardSection');

    if (loginSection) loginSection.classList.remove('hidden');
    if (registerSection) registerSection.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.add('hidden');
}

async function loadAllComplaints() {
    try {
        const response = await fetch(`${API_BASE}/complaints`, {
            credentials: 'include'
        });

        if (response.ok) {
            allComplaints = await response.json();
            displayAllComplaints(allComplaints);
            updateComplaintStats(allComplaints);
        }
    } catch (error) {
        console.error('Error loading complaints:', error);
    }
}

function displayAllComplaints(complaints) {
    const tbody = document.getElementById('complaintsTableBody');
    if (!tbody) return;

    if (!complaints || complaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No complaints found</td></tr>';
        return;
    }

    tbody.innerHTML = complaints.map(c => `
        <tr>
            <td>${c.id.substring(0, 8)}</td>
            <td>${c.type.toUpperCase()}</td>
            <td>${c.category}</td>
            <td>${c.studentId}</td>
            <td>${c.description.substring(0, 50)}...</td>
            <td><span class="status-badge status-${c.status}">${c.status}</span></td>
            <td>${new Date(c.timestamp).toLocaleDateString()}</td>
            <td>
                <button class="action-btn update" onclick="openUpdateModal('${c.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="deleteComplaint('${c.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function updateComplaintStats(complaints) {
    const totalEl = document.getElementById('totalComplaints');
    const pendingEl = document.getElementById('pendingComplaints');
    const inProgressEl = document.getElementById('inProgressComplaints');
    const resolvedEl = document.getElementById('resolvedComplaints');

    if (totalEl) totalEl.textContent = complaints.length;
    if (pendingEl) pendingEl.textContent = complaints.filter(c => c.status === 'pending').length;
    if (inProgressEl) inProgressEl.textContent = complaints.filter(c => c.status === 'in-progress').length;
    if (resolvedEl) resolvedEl.textContent = complaints.filter(c => c.status === 'resolved').length;
}

async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE}/students`, {
            credentials: 'include'
        });

        if (response.ok) {
            const students = await response.json();
            displayStudents(students);
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function displayStudents(students) {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    if (!Array.isArray(students)) {
        console.warn('Expected students array but got', students);
        students = [];
    }

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No students found</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.gmail}</td>
            <td>${s.studentId}</td>
            <td>${s.phone || '-'}</td>
            <td>${new Date(s.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

async function handleTeacherLogin(event) {
    event.preventDefault();

    const gmail = document.getElementById('loginGmail')?.value;
    const teacherId = document.getElementById('loginTeacherId')?.value;
    const password = document.getElementById('loginPassword')?.value;

    if (!gmail || !teacherId || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    try {
        const data = await apiCall('/teachers/login', {
            method: 'POST',
            body: JSON.stringify({ gmail, teacherId, password })
        });

        showToast('Login successful!');
        currentTeacher = data;
        showTeacherDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleTeacherRegistration(event) {
    event.preventDefault();

    const name = document.getElementById('regName')?.value;
    const gmail = document.getElementById('regGmail')?.value;
    const teacherId = document.getElementById('regTeacherId')?.value;
    const department = document.getElementById('regDepartment')?.value;
    const password = document.getElementById('regPassword')?.value;

    if (!name || !gmail || !teacherId || !password) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    if (!gmail.endsWith('@gmail.com')) {
        showToast('Please use a valid Gmail address', 'error');
        return;
    }

    try {
        await apiCall('/teachers/register', {
            method: 'POST',
            body: JSON.stringify({ name, gmail, teacherId, department, password })
        });

        showToast('Registration successful! Please login.');

        const showLogin = document.getElementById('showLogin');
        if (showLogin) showLogin.click();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleTeacherLogout() {
    try {
        await apiCall('/teachers/logout', { method: 'POST' });
        currentTeacher = null;
        hideTeacherDashboard();
        showToast('Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function openUpdateModal(complaintId) {
    const modal = document.getElementById('updateModal');
    const hiddenInput = document.getElementById('updateComplaintId');

    if (modal && hiddenInput) {
        hiddenInput.value = complaintId;
        modal.classList.add('active');
    }
}

function closeUpdateModal() {
    const modal = document.getElementById('updateModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

async function updateComplaintStatus(eventOrId) {

    let complaintId, status, resolutionNotes;

    if (typeof eventOrId === 'string') {
        complaintId = eventOrId;
        status = document.getElementById('updateStatus')?.value;
        resolutionNotes = document.getElementById('updateNotes')?.value;
    } else {
        const event = eventOrId;
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        complaintId = document.getElementById('updateComplaintId')?.value;
        status = document.getElementById('updateStatus')?.value;
        resolutionNotes = document.getElementById('updateNotes')?.value;
    }

    if (!complaintId || !status) {
        showToast('Please select a status', 'error');
        return;
    }

    try {
        await apiCall(`/complaints/${complaintId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, resolutionNotes })
        });

        showToast('Status updated successfully!', 'success');
        closeUpdateModal();
        loadAllComplaints();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteComplaint(complaintId) {
    if (!confirm('Are you sure you want to delete this complaint?')) {
        return;
    }

    try {
        await apiCall(`/complaints/${complaintId}`, {
            method: 'DELETE'
        });

        showToast('Complaint deleted successfully!', 'success');
        loadAllComplaints();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function filterComplaints() {
    const searchInput = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';

    const filtered = allComplaints.filter(c => {
        const matchesSearch = c.description.toLowerCase().includes(searchInput) || 
                           c.studentId.toLowerCase().includes(searchInput);
        const matchesStatus = !statusFilter || c.status === statusFilter;
        const matchesCategory = !categoryFilter || c.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    displayAllComplaints(filtered);
}

function studentSwitchTab(tabId) {
    const tabs = document.querySelectorAll('#dashboardSection .tab-content');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    const buttons = document.querySelectorAll('#dashboardSection .tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    const selectedBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }

    if (tabId === 'my-complaints') {
        loadStudentComplaints();
    } else if (tabId === 'profile') {
        loadStudentProfile();
    }
}

function teacherSwitchTab(tabId) {
    const tabs = document.querySelectorAll('#dashboardSection .tab-content');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    const buttons = document.querySelectorAll('#dashboardSection .tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    const selectedBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }

    if (tabId === 'all-complaints') {
        loadAllComplaints();
    } else if (tabId === 'students') {
        loadStudents();
    }
}

async function fetchPublicUrl() {
    try {
        const resp = await fetch('/api/public-url');
        if (!resp.ok) return;
        const data = await resp.json();
        const banner = document.getElementById('publicUrlBanner');
        const textEl = document.getElementById('publicUrlText');
        if (banner && textEl && data.publicUrl) {
            textEl.textContent = data.publicUrl;
            banner.classList.remove('hidden');

            const copyBtn = banner.querySelector('.copy-btn');
            if (copyBtn) {
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(data.publicUrl).then(() => {
                        showToast('URL copied to clipboard');
                    });
                };
            }

            document.body.style.paddingTop = '2.5rem';
        }
    } catch (e) {
        console.error('Error fetching public URL:', e);
    }
}

function initStudentPortal() {

    fetchPublicUrl();
    checkStudentSession();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleStudentLogin);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleStudentRegistration);
    }

    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', handleComplaintSubmission);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleStudentLogout);
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            if (tabId) studentSwitchTab(tabId);
        });
    });

    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');

    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginSection) loginSection.classList.add('hidden');
            if (registerSection) registerSection.classList.remove('hidden');
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerSection) registerSection.classList.add('hidden');
            if (loginSection) loginSection.classList.remove('hidden');
        });
    }
}

function initTeacherPortal() {

    fetchPublicUrl();
    checkTeacherSession();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleTeacherLogin);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleTeacherRegistration);
    }

    const updateForm = document.getElementById('updateForm');
    if (updateForm) {
        updateForm.addEventListener('submit', updateComplaintStatus);
    }

    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', closeUpdateModal);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleTeacherLogout);
    }

    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterComplaints, 300));
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterComplaints);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterComplaints);
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            if (tabId) teacherSwitchTab(tabId);
        });
    });

    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');

    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginSection) loginSection.classList.add('hidden');
            if (registerSection) registerSection.classList.remove('hidden');
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerSection) registerSection.classList.add('hidden');
            if (loginSection) loginSection.classList.remove('hidden');
        });
    }
}

window.openUpdateModal = openUpdateModal;
window.closeUpdateModal = closeUpdateModal;
window.deleteComplaint = deleteComplaint;
window.filterComplaints = filterComplaints;
window.showToast = showToast;

window.fetchPublicUrl = fetchPublicUrl;

window.handleStudentRegister = handleStudentRegistration;
window.handleComplaintSubmit = handleComplaintSubmission;
window.handleAdminLogin = handleTeacherLogin;

window.handleStudentRegistration = handleStudentRegistration;
window.handleComplaintSubmission = handleComplaintSubmission;
window.handleTeacherLogin = handleTeacherLogin;
window.updateComplaintStatus = updateComplaintStatus;
