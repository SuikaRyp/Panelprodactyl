class PanelControl {
    constructor() {
        this.socket = io();
        this.token = localStorage.getItem('token');
        this.user = null;
        this.init();
    }

    init() {
        if (this.token) {
            this.loadUserInfo();
            this.showDashboard();
        } else {
            this.showLogin();
        }

        this.setupEventListeners();
        this.setupSocketListeners();
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
    }

    setupSocketListeners() {
        this.socket.on('server-status', (data) => {
            this.updateServerStatus(data.serverId, data.status);
        });

        this.socket.on('whatsapp-qr', (data) => {
            this.showQRCode(data.qr, data.serverId);
        });

        this.socket.on('whatsapp-ready', (data) => {
            this.updateWhatsAppStatus(data.serverId, 'ready');
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                this.showDashboard();
                this.loadServers();
            } else {
                alert('Login failed: ' + data.error);
            }
        } catch (error) {
            alert('Login error: ' + error.message);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                alert('Registration successful! Please login.');
                document.querySelector('a[href="#login"]').click();
                e.target.reset();
            } else {
                alert('Registration failed: ' + data.error);
            }
        } catch (error) {
            alert('Registration error: ' + error.message);
        }
    }

    async loadUserInfo() {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                this.user = await response.json();
                document.getElementById('userInfo').innerHTML = `
                    <strong>${this.user.username}</strong><br>
                    Credits: ${this.user.credits}<br>
                    Role: ${this.user.role}
                `;
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    async loadServers() {
        try {
            const response = await fetch('/api/servers', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            const servers = await response.json();
            this.renderServers(servers);
        } catch (error) {
            console.error('Error loading servers:', error);
        }
    }

    renderServers(servers) {
        const container = document.getElementById('serversList');
        container.innerHTML = '';

        servers.forEach(server => {
            const serverCard = `
                <div class="col-md-6 mb-3">
                    <div class="card server-card status-${server.status}">
                        <div class="card-body">
                            <h5 class="card-title">${server.name}</h5>
                            <p class="card-text">
                                Type: ${server.type}<br>
                                Status: <span class="badge bg-${this.getStatusColor(server.status)}">${server.status}</span>
                            </p>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-success" onclick="startServer('${server._id}')" ${server.status === 'running' ? 'disabled' : ''}>
                                    <i class="fas fa-play"></i> Start
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="stopServer('${server._id}')" ${server.status !== 'running' ? 'disabled' : ''}>
                                    <i class="fas fa-stop"></i> Stop
                                </button>
                                <button class="btn btn-sm btn-primary" onclick="initializeWhatsApp('${server._id}')" ${server.type !== 'whatsapp' ? 'disabled' : ''}>
                                    <i class="fab fa-whatsapp"></i> Init
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += serverCard;
        });
    }

    getStatusColor(status) {
        const colors = {
            'running': 'success',
            'stopped': 'danger',
            'error': 'warning'
        };
        return colors[status] || 'secondary';
    }

    showQRCode(qr, serverId) {
        // Implement QR code display
        console.log('QR Code for server', serverId, qr);
        // You can use a QR code library here
    }

    updateServerStatus(serverId, status) {
        const badge = document.querySelector(`[onclick*="${serverId}"]`).closest('.card').querySelector('.badge');
        badge.textContent = status;
        badge.className = `badge bg-${this.getStatusColor(status)}`;
    }

    showDashboard() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
    }

    showLogin() {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    }

    handleLogout() {
        localStorage.removeItem('token');
        this.token = null;
        this.user = null;
        this.showLogin();
    }
}

// Global functions for button clicks
async function createServer() {
    const form = document.getElementById('createServerForm');
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/api/servers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${panel.token}`
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (response.ok) {
            const server = await response.json();
            panel.loadServers();
            bootstrap.Modal.getInstance(document.getElementById('createServerModal')).hide();
            form.reset();
        }
    } catch (error) {
        alert('Error creating server: ' + error.message);
    }
}

async function startServer(serverId) {
    try {
        const response = await fetch(`/api/servers/${serverId}/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${panel.token}` }
        });
        
        if (response.ok) {
            panel.loadServers();
        }
    } catch (error) {
        alert('Error starting server: ' + error.message);
    }
}

async function stopServer(serverId) {
    try {
        const response = await fetch(`/api/servers/${serverId}/stop`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${panel.token}` }
        });
        
        if (response.ok) {
            panel.loadServers();
        }
    } catch (error) {
        alert('Error stopping server: ' + error.message);
    }
}

async function initializeWhatsApp(serverId) {
    try {
        const response = await fetch('/api/whatsapp/initialize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${panel.token}`
            },
            body: JSON.stringify({ serverId })
        });
        
        if (response.ok) {
            alert('WhatsApp client initializing. Check QR code.');
        }
    } catch (error) {
        alert('Error initializing WhatsApp: ' + error.message);
    }
}

// Initialize application
const panel = new PanelControl();
