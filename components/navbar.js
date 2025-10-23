class CustomNavbar extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                nav {
                    background: #ffffff;
                    padding: 1rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    position: sticky;
                    top: 0;
                    z-index: 1020;
                }
                .logo {
                    display: flex;
                    align-items: center;
                    font-weight: bold;
                    font-size: 1.25rem;
                    color: #111827;
                }
                .logo-icon {
                    color: #4f46e5;
                    margin-right: 0.5rem;
                }
                .user-menu {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    position: relative;
                }
                .settings-btn {
                    background: none;
                    border: none;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .settings-btn:hover {
                    background: #f3f4f6;
                    color: #4f46e5;
                }
                .settings-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 0.5rem;
                    background: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                    min-width: 280px;
                    display: none;
                    z-index: 1000;
                    padding: 0;
                    overflow: hidden;
                }
                .settings-dropdown.show {
                    display: block;
                }
                .dropdown-header {
                    background: #f9fafb;
                    padding: 1rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                .dropdown-user {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background-color: #4f46e5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 1rem;
                }
                .user-info {
                    flex: 1;
                }
                .user-name {
                    font-weight: 600;
                    color: #111827;
                    font-size: 0.95rem;
                }
                .login-time {
                    font-size: 0.75rem;
                    color: #6b7280;
                    margin-top: 0.125rem;
                }
                .dropdown-body {
                    padding: 0.5rem 0;
                }
                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    color: #374151;
                    text-decoration: none;
                    cursor: pointer;
                    transition: background 0.2s;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                    font-size: 0.875rem;
                }
                .dropdown-item:hover {
                    background: #f9fafb;
                }
                .dropdown-item.logout {
                    color: #ef4444;
                    border-top: 1px solid #e5e7eb;
                    margin-top: 0.25rem;
                }
                .dropdown-item.logout:hover {
                    background: #fef2f2;
                }
                .dropdown-item svg {
                    width: 18px;
                    height: 18px;
                }
                @media (max-width: 576px) {
                    nav {
                        padding: 0.75rem 1rem;
                    }
                    .logo {
                        font-size: 1rem;
                    }
                    .settings-dropdown {
                        min-width: 260px;
                        right: -1rem;
                    }
                }
            </style>
            <nav>
                <div class="logo">
                    <i data-feather="activity" class="logo-icon"></i>
                    <span>CodePulse Insights</span>
                </div>
                <div class="user-menu">
                    <button class="settings-btn" id="settingsBtn">
                        <i data-feather="settings" style="width: 22px; height: 22px;"></i>
                    </button>
                    <div class="settings-dropdown" id="settingsDropdown">
                        <div class="dropdown-header">
                            <div class="dropdown-user">
                                <div class="avatar" id="userAvatar">A</div>
                                <div class="user-info">
                                    <div class="user-name" id="userName">Admin User</div>
                                    <div class="login-time" id="loginTime">Logged in at --:--</div>
                                </div>
                            </div>
                        </div>
                        <div class="dropdown-body">
                            <button class="dropdown-item logout" id="logoutBtn">
                                <i data-feather="log-out"></i>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;
        
        // Initialize after shadow DOM is created
        setTimeout(() => {
            this.init();
            // Initialize feather icons in shadow DOM
            if (window.feather) {
                const icons = this.shadowRoot.querySelectorAll('[data-feather]');
                icons.forEach(icon => {
                    const iconName = icon.getAttribute('data-feather');
                    const svg = feather.icons[iconName].toSvg();
                    icon.innerHTML = svg;
                });
            }
        }, 0);
    }
    
    init() {
        const settingsBtn = this.shadowRoot.getElementById('settingsBtn');
        const dropdown = this.shadowRoot.getElementById('settingsDropdown');
        const logoutBtn = this.shadowRoot.getElementById('logoutBtn');
        
        // Toggle dropdown
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
        
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Logout functionality
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('loginTime');
            window.location.reload();
        });
        
        // Load user data from session
        this.loadUserData();
        
        // Re-initialize feather icons after dropdown is rendered
        setTimeout(() => {
            if (window.feather) {
                const icons = this.shadowRoot.querySelectorAll('[data-feather]');
                icons.forEach(icon => {
                    const iconName = icon.getAttribute('data-feather');
                    if (feather.icons[iconName]) {
                        const svg = feather.icons[iconName].toSvg();
                        icon.innerHTML = svg;
                    }
                });
            }
        }, 100);
    }
    
    loadUserData() {
        const username = sessionStorage.getItem('username') || 'Admin User';
        const loginTime = sessionStorage.getItem('loginTime') || new Date().toLocaleTimeString();
        
        const userNameEl = this.shadowRoot.getElementById('userName');
        const loginTimeEl = this.shadowRoot.getElementById('loginTime');
        const avatarEl = this.shadowRoot.getElementById('userAvatar');
        
        if (userNameEl) userNameEl.textContent = username;
        if (loginTimeEl) loginTimeEl.textContent = `Logged in at ${loginTime}`;
        if (avatarEl) avatarEl.textContent = username.charAt(0).toUpperCase();
    }
}
customElements.define('custom-navbar', CustomNavbar);