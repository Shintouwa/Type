const socket = io();
let authToken = localStorage.getItem('admin_token');

// Check Auth on Load
if (authToken) {
    showDashboard();
}

function adminLogin() {
    const username = document.getElementById('admin-user').value;
    const password = document.getElementById('admin-pass').value;

    fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                authToken = data.token;
                localStorage.setItem('admin_token', authToken);
                showDashboard();
            } else {
                alert("Login Failed: " + (data.message || "Unknown error"));
            }
        })
        .catch(err => console.error(err));
}

function showDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';
    loadParagraphs();
    fetchResults();
}

function logout() {
    authToken = null;
    localStorage.removeItem('admin_token');
    location.reload();
}

// Paragraph Management
async function loadParagraphs() {
    const select = document.getElementById('paragraph-select');
    select.innerHTML = '<option value="">Loading...</option>';

    const res = await fetch('/api/paragraphs');
    const paragraphs = await res.json();

    select.innerHTML = '<option value="">Select a Paragraph</option>';
    paragraphs.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.text; // Value is the text itself for simplicity, or ID
        opt.innerText = `${p.title} (${p.difficulty})`;
        select.appendChild(opt);
    });
}

async function addParagraph() {
    const title = document.getElementById('new-para-title').value;
    const text = document.getElementById('new-para-text').value;

    if (!title || !text) return alert("Fill all fields");

    await fetch('/api/paragraphs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': authToken
        },
        body: JSON.stringify({ title, text, difficulty: 'Medium' })
    });

    alert("Paragraph Added");
    loadParagraphs();
}

// Test Control
function startTest() {
    const select = document.getElementById('paragraph-select');
    const text = select.value;
    const duration = parseInt(document.getElementById('test-duration').value);

    if (!text) return alert("Select a paragraph");

    socket.emit('admin_start_test', { duration, paragraphText: text });
    alert("Test Started!");
}

function forceEndTest() {
    socket.emit('admin_force_end');
    alert("Test Forced to End");
}

// Results
async function fetchResults() {
    const res = await fetch('/api/results', {
        headers: { 'x-auth-token': authToken }
    });
    if (res.status === 401) return logout();

    const results = await res.json();
    const tbody = document.querySelector('#results-table tbody');
    tbody.innerHTML = '';

    results.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.participantName}</td>
            <td>${r.wpm}</td>
            <td>${r.accuracy}%</td>
            <td>${r.finalScore}</td>
            <td>${new Date(r.timestamp).toLocaleTimeString()}</td>
        `;
        tbody.appendChild(tr);
    });
}

socket.on('new_result', (r) => {
    // Basic append to table if on dashboard
    const tbody = document.querySelector('#results-table tbody');
    const tr = document.createElement('tr');
    tr.style.background = '#03dac633'; // Highlight new
    tr.innerHTML = `
        <td>${r.participantName}</td>
        <td>${r.wpm}</td>
        <td>${r.accuracy}%</td>
        <td>${r.finalScore}</td>
        <td>${new Date(r.timestamp).toLocaleTimeString()}</td>
    `;
    tbody.prepend(tr);
});

function exportCSV() {
    // Simple Client-side CSV
    const rows = [];
    document.querySelectorAll('#results-table tr').forEach(tr => {
        const cols = Array.from(tr.querySelectorAll('td, th')).map(td => td.innerText);
        rows.push(cols.join(','));
    });
    const csvContent = "data:text/csv;charset=utf-8," + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "typing_results.csv");
    document.body.appendChild(link);
    link.click();
}
