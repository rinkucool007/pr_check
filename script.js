// Global variables to store parsed data
let prData = [];
let filteredData = [];
let prTrendData = {};
let prStatusData = {};
let contributorData = {};
let mergeTimeData = {};
let prTableData = [];
let currentViewType = 'daily';
let dateRange = { start: null, end: null };
let chartInstances = {};

// Fetch and parse CSV data
async function loadCSVData() {
    try {
        const response = await fetch('data/pr_data.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        prData = parseCSV(csvText);
        
        // Set default date range to last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        dateRange = { start: startDate, end: endDate };
        
        // Filter and process data
        filterDataByDateRange();
        processDataForCharts();
        processDataForTable();
        
        // Initialize charts and table with real data
        initCharts();
        populatePRTable();
        
        // Initialize date picker and view toggle
        initializeDatePicker();
        initializeViewToggle();
    } catch (error) {
        console.error('Error loading CSV data:', error);
        alert('Failed to load PR data from CSV file. Please ensure data/pr_data.csv exists and is accessible.');
    }
}

// Parse CSV text to array of objects
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header.trim()] = values[index] ? values[index].trim() : '';
        });
        data.push(row);
    }
    
    return data;
}

// Filter data by date range
function filterDataByDateRange() {
    if (!dateRange.start || !dateRange.end) {
        filteredData = [...prData];
        return;
    }
    
    filteredData = prData.filter(pr => {
        const prDate = new Date(pr.created_at);
        return prDate >= dateRange.start && prDate <= dateRange.end;
    });
}

// Initialize date picker
function initializeDatePicker() {
    flatpickr("#dateRangePicker", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: [dateRange.start, dateRange.end],
        onChange: function(selectedDates) {
            if (selectedDates.length === 2) {
                dateRange.start = selectedDates[0];
                dateRange.end = selectedDates[1];
                updateDashboard();
            }
        }
    });
}

// Initialize view toggle
function initializeViewToggle() {
    const viewToggle = document.getElementById('viewToggle');
    viewToggle.addEventListener('change', function(e) {
        if (e.target.name === 'viewType') {
            currentViewType = e.target.value;
            updateDashboard();
        }
    });
}

// Update dashboard with new filters
function updateDashboard() {
    filterDataByDateRange();
    processDataForCharts();
    processDataForTable();
    updateCharts();
    populatePRTable();
}

// Update existing charts instead of recreating
function updateCharts() {
    if (chartInstances.trend) {
        chartInstances.trend.data = prTrendData;
        chartInstances.trend.update();
    }
    if (chartInstances.status) {
        chartInstances.status.data = prStatusData;
        chartInstances.status.update();
    }
    if (chartInstances.contributor) {
        chartInstances.contributor.data = contributorData;
        chartInstances.contributor.update();
    }
    if (chartInstances.mergeTime) {
        chartInstances.mergeTime.data = mergeTimeData;
        chartInstances.mergeTime.update();
    }
}

// Parse CSV text to array of objects
function processDataForCharts() {
    // PR Trend Chart - Group by month
    const monthCounts = {};
    prData.forEach(pr => {
        const date = new Date(pr.created_at);
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
    });
    
    prTrendData = {
        labels: Object.keys(monthCounts),
        datasets: [{
            label: 'PRs Created',
            data: Object.values(monthCounts),
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
        }]
    };
    
    // PR Status Distribution
    const statusCounts = {};
    filteredData.forEach(pr => {
        const status = pr.pr_state || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const statusColors = {
        'Awaiting Review': '#4f46e5',
        'Awaiting Merger': '#10b981',
        'Merged': '#10b981',
        'Closed': '#ef4444',
        'Draft': '#6b7280',
        'Open': '#4f46e5'
    };
    
    prStatusData = {
        labels: Object.keys(statusCounts),
        datasets: [{
            data: Object.values(statusCounts),
            backgroundColor: Object.keys(statusCounts).map(status => statusColors[status] || '#6b7280'),
            borderWidth: 0
        }]
    };
    
    // PRs by Contributor
    const contributorCounts = {};
    filteredData.forEach(pr => {
        const actor = pr.Actor || 'Unknown';
        contributorCounts[actor] = (contributorCounts[actor] || 0) + 1;
    });
    
    // Sort and get top 5 contributors
    const sortedContributors = Object.entries(contributorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    contributorData = {
        labels: sortedContributors.map(c => c[0]),
        datasets: [{
            label: 'PRs Created',
            data: sortedContributors.map(c => c[1]),
            backgroundColor: [
                'rgba(79, 70, 229, 0.7)',
                'rgba(79, 70, 229, 0.6)',
                'rgba(79, 70, 229, 0.5)',
                'rgba(79, 70, 229, 0.4)',
                'rgba(79, 70, 229, 0.3)'
            ],
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 1
        }]
    };
    
    // Average Time to Merge (using age_hours)
    const timeBuckets = {
        '<1 day': 0,
        '1-2 days': 0,
        '2-3 days': 0,
        '3-5 days': 0,
        '>5 days': 0
    };
    
    filteredData.forEach(pr => {
        const hours = parseFloat(pr.age_hours) || 0;
        const days = hours / 24;
        
        if (days < 1) timeBuckets['<1 day']++;
        else if (days < 2) timeBuckets['1-2 days']++;
        else if (days < 3) timeBuckets['2-3 days']++;
        else if (days < 5) timeBuckets['3-5 days']++;
        else timeBuckets['>5 days']++;
    });
    
    mergeTimeData = {
        labels: Object.keys(timeBuckets),
        datasets: [{
            label: 'Number of PRs',
            data: Object.values(timeBuckets),
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1
        }]
    };
}

// Process data for table
function processDataForTable() {
    prTableData = filteredData.map(pr => {
        const createdDate = new Date(pr.created_at);
        const ageHours = parseFloat(pr.age_hours) || 0;
        const ageDays = Math.floor(ageHours / 24);
        
        let timeToMerge = 'Pending';
        if (pr.pr_state === 'Merged' || pr.pr_state === 'Awaiting Merger') {
            if (ageHours < 24) {
                timeToMerge = `${ageHours.toFixed(1)} hours`;
            } else {
                timeToMerge = `${ageDays} days`;
            }
        }
        
        return {
            id: pr.PullRequestNumber || pr.pr_id,
            title: pr.PullRequestSummary || 'No title',
            creator: pr.Actor || 'Unknown',
            status: pr.pr_state || 'Unknown',
            created: createdDate.toLocaleDateString(),
            timeToMerge: timeToMerge
        };
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkLoginStatus();
    
    // Load CSV data and initialize dashboard
    loadCSVData();
    
    // Handle login form submission
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Simple authentication (in production would use proper auth)
        if (username === 'admin' && password === 'password') {
            // Store login session
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('loginTime', new Date().toLocaleTimeString());
            
            // Show dashboard
            showDashboard();
        } else {
            alert('Invalid credentials. Please try again.');
        }
    });
});

function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true') {
        showDashboard();
    }
}

function showDashboard() {
    document.getElementById('login-page').classList.add('d-none');
    document.getElementById('dashboard-page').classList.remove('d-none');
    document.getElementById('dashboard-page').classList.add('fade-in');
    // Re-initialize feather icons for dashboard
    setTimeout(() => feather.replace(), 100);
}

function initCharts() {
    // PR Trend Chart
    const trendCtx = document.getElementById('prTrendChart').getContext('2d');
    chartInstances.trend = new Chart(trendCtx, {
        type: 'line',
        data: prTrendData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // PR Status Chart
    const statusCtx = document.getElementById('prStatusChart').getContext('2d');
    chartInstances.status = new Chart(statusCtx, {
        type: 'doughnut',
        data: prStatusData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            },
            cutout: '70%'
        }
    });

    // Contributor Chart
    const contributorCtx = document.getElementById('contributorChart').getContext('2d');
    chartInstances.contributor = new Chart(contributorCtx, {
        type: 'bar',
        data: contributorData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Merge Time Chart
    const mergeCtx = document.getElementById('mergeTimeChart').getContext('2d');
    chartInstances.mergeTime = new Chart(mergeCtx, {
        type: 'bar',
        data: mergeTimeData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function populatePRTable() {
    const tableBody = document.getElementById('pr-table-body');
    tableBody.innerHTML = ''; // Clear existing rows
    
    prTableData.forEach(pr => {
        const row = document.createElement('tr');
        
        // Status badge color
        let statusClass = '';
        switch(pr.status) {
            case 'Merged':
            case 'Awaiting Merger':
                statusClass = 'badge bg-success';
                break;
            case 'Open':
            case 'Awaiting Review':
                statusClass = 'badge bg-primary';
                break;
            case 'Draft':
                statusClass = 'badge bg-secondary';
                break;
            case 'Closed':
                statusClass = 'badge bg-danger';
                break;
            default:
                statusClass = 'badge bg-secondary';
        }
        
        row.innerHTML = `
            <td class="fw-medium">${pr.id}</td>
            <td>${pr.title}</td>
            <td>${pr.creator}</td>
            <td><span class="${statusClass}">${pr.status}</span></td>
            <td>${pr.created}</td>
            <td>${pr.timeToMerge}</td>
        `;
        
        tableBody.appendChild(row);
    });
}