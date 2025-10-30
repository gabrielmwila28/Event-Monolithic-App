// EventFlow Pro - Professional Event Management System
class EventFlowPro {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.token = localStorage.getItem('eventflow_token');
        this.user = JSON.parse(localStorage.getItem('eventflow_user') || 'null');
        this.events = [];
        this.currentSection = 'dashboard';
        this.currentView = 'grid';
        this.isSidebarCollapsed = localStorage.getItem('eventflow_sidebar_collapsed') === 'true';
        this.theme = localStorage.getItem('eventflow_theme') || 'light';
        
        this.init();
    }

    async init() {
        this.setTheme(this.theme);
        this.setupEventListeners();
        this.setupInterceptors();
        
        // Check auth but show auth modal first if not logged in
        this.checkAuth();
        
        // Always show auth modal first if not logged in
        if (!this.user) {
            this.showAuthModal();
            // Hide main content until authenticated
            document.querySelector('.main-content').style.display = 'none';
        } else {
            // User is logged in, show main content
            document.querySelector('.main-content').style.display = 'flex';
            this.loadInitialData();
        }
        
        console.log('🚀 EventFlow Pro initialized');
    }

    // ===== THEME MANAGEMENT =====
    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('eventflow_theme', theme);
        
        // Update theme toggle text
        const themeText = document.querySelector('.theme-text');
        if (themeText) {
            themeText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
        }
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        this.hideUserMenu();
        this.showToast(`Switched to ${newTheme} mode`, 'success');
    }

    // ===== AUTHENTICATION SYSTEM =====
    async login() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!this.validateEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        if (!password) {
            this.showToast('Please enter your password', 'error');
            return;
        }

        this.showLoading(true);

        try {
            // For demo purposes - simulate API call
            setTimeout(() => {
                // Mock successful login
                this.token = 'demo_token_' + Date.now();
                this.user = {
                    id: 'user_' + Date.now(),
                    email: email,
                    role: 'ORGANIZER' // Default role for demo
                };
                
                localStorage.setItem('eventflow_token', this.token);
                localStorage.setItem('eventflow_user', JSON.stringify(this.user));
                
                this.showToast(`Welcome back, ${this.user.email}!`, 'success');
                this.hideAuthModal();
                this.checkAuth();
                this.loadInitialData();
                
                // Track login analytics
                this.trackEvent('user_login', { role: this.user.role });
                this.showLoading(false);
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Connection error. Please try again.', 'error');
            this.showLoading(false);
        }
    }

    async signup() {
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const role = document.getElementById('signup-role').value;
        const acceptTerms = document.getElementById('accept-terms').checked;

        if (!this.validateEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters', 'error');
            return;
        }

        if (!acceptTerms) {
            this.showToast('Please accept the terms and conditions', 'error');
            return;
        }

        this.showLoading(true);

        try {
            // For demo purposes - simulate API call
            setTimeout(() => {
                // Mock successful signup
                this.showToast('Account created successfully! Please sign in.', 'success');
                this.switchAuthTab('login');
                // Pre-fill email and focus password
                document.getElementById('email').value = email;
                document.getElementById('password').focus();
                
                // Track signup analytics
                this.trackEvent('user_signup', { role: role });
                this.showLoading(false);
            }, 1500);
            
        } catch (error) {
            console.error('Signup error:', error);
            this.showToast('Connection error. Please try again.', 'error');
            this.showLoading(false);
        }
    }

    logout() {
        if (!this.user) return;
        
        // Track logout analytics
        this.trackEvent('user_logout', { role: this.user.role });
        
        const userEmail = this.user.email;
        
        this.token = null;
        this.user = null;
        localStorage.removeItem('eventflow_token');
        localStorage.removeItem('eventflow_user');
        
        if (this.ws) {
            this.ws.close();
        }
        
        this.showToast(`Goodbye, ${userEmail}! You have been signed out.`, 'success');
        this.hideUserMenu();
        this.checkAuth(); // This will hide main content and show auth modal
        this.events = [];
        this.updateDashboard();
    }

    checkAuth() {
        const navUser = document.getElementById('nav-user');
        const analyticsNav = document.getElementById('analytics-nav');
        const userAvatar = document.getElementById('user-avatar');
        const userAvatarSm = document.getElementById('user-avatar-sm');
        const userName = document.getElementById('user-name');
        const userRole = document.getElementById('user-role');
        const mainContent = document.querySelector('.main-content');

        if (this.user) {
            // User is logged in - show main content
            mainContent.style.display = 'flex';
            
            // Update user info
            userName.textContent = this.user.email;
            userRole.textContent = this.formatUserRole(this.user.role);
            userRole.className = `user-role role-${this.user.role.toLowerCase()}`;
            
            // Update avatars with first letter
            const firstLetter = this.user.email.charAt(0).toUpperCase();
            userAvatar.innerHTML = firstLetter;
            userAvatarSm.innerHTML = firstLetter;
            
            // Show admin features
            if (this.user.role === 'ADMIN') {
                analyticsNav.style.display = 'flex';
            } else {
                analyticsNav.style.display = 'none';
            }

            // Update breadcrumb
            this.updateBreadcrumb(this.currentSection);
            
        } else {
            // User is not logged in - hide main content
            mainContent.style.display = 'none';
            userAvatarSm.innerHTML = '<i class="fas fa-user"></i>';
            
            // Show auth modal if not already shown
            if (!document.getElementById('auth-modal').classList.contains('active')) {
                setTimeout(() => this.showAuthModal(), 100);
            }
        }
    }

    // ===== UI MANAGEMENT =====
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.switchAuthTab(tabName);
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // View toggle
        document.querySelectorAll('.view-option').forEach(option => {
            option.addEventListener('click', () => {
                const view = option.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // Search and filter
        const searchInput = document.getElementById('event-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchEvents(e.target.value);
            }, 300));
        }

        const eventFilter = document.getElementById('event-filter');
        if (eventFilter) {
            eventFilter.addEventListener('change', (e) => {
                this.filterEvents(e.target.value);
            });
        }

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideCreateEventModal();
                this.hideAuthModal();
            }
        });

        // Close user menu when clicking outside
        document.addEventListener('click', (e) => {
            const userMenu = document.getElementById('user-menu');
            const userCard = document.querySelector('.user-card');
            if (userMenu.classList.contains('show') && 
                !userMenu.contains(e.target) && 
                !userCard.contains(e.target)) {
                this.hideUserMenu();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault();
                        this.showSearchModal();
                        break;
                    case 'n':
                        e.preventDefault();
                        if (this.user) this.showCreateEventModal();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.showSection('dashboard');
                        break;
                    case 'e':
                        e.preventDefault();
                        this.showSection('events');
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                this.hideModals();
            }
        });

        // Form submissions
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && document.getElementById('auth-modal').classList.contains('active')) {
                const activeTab = document.querySelector('.auth-tab.active').getAttribute('data-tab');
                if (activeTab === 'login') {
                    this.login();
                } else {
                    this.signup();
                }
            }
        });
    }

    setupInterceptors() {
        // Fetch interceptor for auth
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [resource, config = {}] = args;
            
            // Add auth header if token exists
            if (this.token && !resource.includes('/auth/')) {
                config.headers = {
                    ...config.headers,
                    'Authorization': `Bearer ${this.token}`
                };
            }
            
            try {
                const response = await originalFetch(resource, config);
                
                // Handle 401 responses
                if (response.status === 401) {
                    this.showToast('Session expired. Please sign in again.', 'error');
                    this.logout();
                    return response;
                }
                
                return response;
            } catch (error) {
                console.error('Fetch error:', error);
                throw error;
            }
        };
    }

    showSection(sectionName) {
        if (!this.user) {
            this.showAuthModal();
            return;
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        this.currentSection = sectionName;
        this.updateBreadcrumb(sectionName);

        // Load section-specific data
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'events':
                this.loadEvents();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'analytics':
                if (this.user?.role === 'ADMIN') {
                    this.loadAnalytics();
                }
                break;
        }
        
        // Track section view
        this.trackEvent('section_view', { section: sectionName });
    }

    updateBreadcrumb(section) {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (!breadcrumb) return;

        const sectionTitles = {
            dashboard: 'Dashboard',
            events: 'Events',
            calendar: 'Calendar',
            attendees: 'Attendees',
            analytics: 'Analytics',
            reports: 'Reports',
            settings: 'Settings'
        };

        breadcrumb.innerHTML = `
            <span class="breadcrumb-item active">${sectionTitles[section] || section}</span>
        `;
    }

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
        localStorage.setItem('eventflow_sidebar_collapsed', this.isSidebarCollapsed);
        
        const sidebar = document.getElementById('sidebar');
        if (this.isSidebarCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
    }

    switchView(view) {
        this.currentView = view;
        
        // Update view toggle buttons
        document.querySelectorAll('.view-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Update events grid
        const eventsGrid = document.getElementById('events-grid');
        if (eventsGrid) {
            eventsGrid.className = `events-grid view-${view}`;
            this.renderEvents();
        }
        
        this.trackEvent('view_switch', { view: view });
    }

    // ===== MODAL MANAGEMENT =====
    showAuthModal() {
        document.getElementById('auth-modal').classList.add('active');
        document.body.style.overflow = 'hidden';
        this.switchAuthTab('login');
    }

    hideAuthModal() {
        document.getElementById('auth-modal').classList.remove('active');
        document.body.style.overflow = '';
    }

    showCreateEventModal() {
        if (!this.user) {
            this.showAuthModal();
            return;
        }
        document.getElementById('create-event-modal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideCreateEventModal() {
        document.getElementById('create-event-modal').classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('create-event-form').reset();
    }

    hideModals() {
        this.hideAuthModal();
        this.hideCreateEventModal();
        this.hideNotifications();
        this.hideUserMenu();
    }

    switchAuthTab(tabName) {
        // Update tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tabName}-form`).classList.add('active');
    }

    showUserMenu() {
        const userMenu = document.getElementById('user-menu');
        userMenu.classList.toggle('show');
    }

    hideUserMenu() {
        const userMenu = document.getElementById('user-menu');
        userMenu.classList.remove('show');
    }

    showNotifications() {
        document.getElementById('notifications-panel').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hideNotifications() {
        document.getElementById('notifications-panel').classList.remove('show');
        document.body.style.overflow = '';
    }

    toggleNotifications() {
        const panel = document.getElementById('notifications-panel');
        if (panel.classList.contains('show')) {
            this.hideNotifications();
        } else {
            this.showNotifications();
        }
    }

    // ===== DATA MANAGEMENT =====
    async loadInitialData() {
        if (!this.user) return;
        
        try {
            await Promise.all([
                this.loadEvents(),
                this.loadDashboard()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    async loadEvents() {
        if (!this.token) return;

        try {
            // For demo purposes - generate mock events
            this.generateMockEvents();
            this.renderEvents();
            this.updateDashboard();
            this.updateEventsCount();
            
        } catch (error) {
            console.error('Error loading events:', error);
            this.showToast('Failed to load events', 'error');
        }
    }

    generateMockEvents() {
        // Generate some mock events for demo
        this.events = [
            {
                id: 'event_1',
                title: 'Tech Conference 2024',
                description: 'Annual technology conference featuring the latest innovations in software development, AI, and cloud computing.',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                location: 'Convention Center, Downtown',
                category: 'conference',
                duration: 240,
                tags: ['tech', 'conference', 'networking'],
                capacity: 500,
                approved: true,
                organizer: { id: 'org_1', email: 'organizer@techconf.com' },
                rsvps: [
                    { user: { id: 'user_2', email: 'attendee1@example.com' }, status: 'GOING' },
                    { user: { id: 'user_3', email: 'attendee2@example.com' }, status: 'MAYBE' }
                ],
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'event_2',
                title: 'React Workshop',
                description: 'Hands-on workshop for learning React.js fundamentals and best practices.',
                date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                location: 'Online - Zoom',
                category: 'workshop',
                duration: 120,
                tags: ['react', 'javascript', 'webdev'],
                capacity: 50,
                approved: true,
                organizer: { id: this.user.id, email: this.user.email },
                rsvps: [
                    { user: { id: 'user_4', email: 'dev1@example.com' }, status: 'GOING' }
                ],
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'event_3',
                title: 'Startup Networking Mixer',
                description: 'Networking event for entrepreneurs, investors, and startup enthusiasts.',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                location: 'Innovation Hub, Tech District',
                category: 'social',
                duration: 180,
                tags: ['networking', 'startup', 'entrepreneurship'],
                capacity: 100,
                approved: false,
                organizer: { id: 'org_2', email: 'events@startuphub.com' },
                rsvps: [],
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    async createEvent() {
        const title = document.getElementById('event-title').value.trim();
        const description = document.getElementById('event-description').value.trim();
        const date = document.getElementById('event-date').value;
        const location = document.getElementById('event-location').value.trim();
        const category = document.getElementById('event-category').value;
        const duration = document.getElementById('event-duration').value;
        const tags = document.getElementById('event-tags').value;
        const capacity = document.getElementById('event-capacity').value;

        if (!title || !description || !date || !location) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        this.showLoading(true);

        try {
            // For demo purposes - simulate API call
            setTimeout(() => {
                const newEvent = {
                    id: 'event_' + Date.now(),
                    title,
                    description,
                    date,
                    location,
                    category,
                    duration: parseInt(duration),
                    tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                    capacity: capacity ? parseInt(capacity) : null,
                    approved: this.user.role === 'ADMIN',
                    organizer: { id: this.user.id, email: this.user.email },
                    rsvps: [],
                    createdAt: new Date().toISOString()
                };

                this.events.unshift(newEvent);
                this.showToast('Event created successfully!', 'success');
                this.hideCreateEventModal();
                this.renderEvents();
                this.updateDashboard();
                
                // Track event creation
                this.trackEvent('event_created', { 
                    category: category,
                    hasCapacity: !!capacity 
                });
                this.showLoading(false);
            }, 1500);
            
        } catch (error) {
            console.error('Error creating event:', error);
            this.showToast('Failed to create event', 'error');
            this.showLoading(false);
        }
    }

    async rsvpToEvent(eventId, status) {
        try {
            // For demo purposes - simulate API call
            setTimeout(() => {
                const event = this.events.find(e => e.id === eventId);
                if (event) {
                    // Remove existing RSVP if any
                    event.rsvps = event.rsvps.filter(rsvp => rsvp.user.id !== this.user.id);
                    
                    // Add new RSVP
                    event.rsvps.push({
                        user: { id: this.user.id, email: this.user.email },
                        status: status
                    });
                    
                    this.showToast(`RSVP status: ${status}`, 'success');
                    this.renderEvents();
                    
                    // Track RSVP
                    this.trackEvent('event_rsvp', { status: status });
                }
            }, 500);
            
        } catch (error) {
            this.showToast('Failed to update RSVP', 'error');
        }
    }

    async approveEvent(eventId) {
        try {
            // For demo purposes - simulate API call
            setTimeout(() => {
                const event = this.events.find(e => e.id === eventId);
                if (event) {
                    event.approved = true;
                    this.showToast('Event approved successfully!', 'success');
                    this.renderEvents();
                    
                    // Track approval
                    this.trackEvent('event_approved');
                }
            }, 500);
            
        } catch (error) {
            this.showToast('Failed to approve event', 'error');
        }
    }

    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }

        try {
            // For demo purposes - simulate API call
            setTimeout(() => {
                this.events = this.events.filter(event => event.id !== eventId);
                this.showToast('Event deleted successfully!', 'success');
                this.renderEvents();
                this.updateDashboard();
                
                // Track deletion
                this.trackEvent('event_deleted');
            }, 500);
            
        } catch (error) {
            this.showToast('Failed to delete event', 'error');
        }
    }

    // ===== RENDERING SYSTEM =====
    renderEvents() {
        const container = document.getElementById('events-grid');
        if (!container) return;

        if (this.events.length === 0) {
            container.innerHTML = this.renderEmptyState('events');
            return;
        }

        const eventsToRender = this.filteredEvents || this.events;
        
        if (eventsToRender.length === 0) {
            container.innerHTML = this.renderEmptyState('filtered-events');
            return;
        }

        container.innerHTML = eventsToRender.map(event => `
            <div class="event-card" data-event-id="${event.id}">
                <div class="event-header">
                    <div class="event-category">${this.formatCategory(event.category)}</div>
                    ${!event.approved ? '<span class="event-status pending">Pending Approval</span>' : ''}
                </div>
                <div class="event-body">
                    <h3 class="event-title">${this.escapeHtml(event.title)}</h3>
                    <p class="event-description">${this.escapeHtml(event.description)}</p>
                    <div class="event-meta">
                        <div class="meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>${this.formatDate(event.date)}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${this.formatTime(event.date)}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${this.escapeHtml(event.location)}</span>
                        </div>
                    </div>
                    <div class="event-organizer">
                        <i class="fas fa-user"></i>
                        Organized by ${this.escapeHtml(event.organizer.email)}
                    </div>
                </div>
                <div class="event-footer">
                    <div class="event-stats">
                        <span class="stat">
                            <i class="fas fa-users"></i>
                            ${event.rsvps.length} attendees
                        </span>
                    </div>
                    <div class="event-actions">
                        ${this.renderEventActions(event)}
                    </div>
                </div>
            </div>
        `).join('');

        this.updateFilteredEventsCount(eventsToRender.length);
    }

    renderEventActions(event) {
        let actions = '';
        
        // RSVP buttons for attendees
        if (this.user.role === 'ATTENDEE' && event.approved) {
            const userRSVP = event.rsvps.find(rsvp => rsvp.user.id === this.user.id);
            const currentStatus = userRSVP ? userRSVP.status : null;
            
            actions += `
                <div class="rsvp-section">
                    <div class="rsvp-status">
                        <strong>Your RSVP:</strong>
                        ${currentStatus ? `<span class="rsvp-badge ${currentStatus.toLowerCase()}">${currentStatus}</span>` : 'Not responded'}
                    </div>
                    <div class="rsvp-buttons">
                        <button class="btn btn-success btn-sm" onclick="app.rsvpToEvent('${event.id}', 'GOING')">
                            <i class="fas fa-check"></i>
                            Going
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="app.rsvpToEvent('${event.id}', 'MAYBE')">
                            <i class="fas fa-question"></i>
                            Maybe
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="app.rsvpToEvent('${event.id}', 'NOT_GOING')">
                            <i class="fas fa-times"></i>
                            Can't Go
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Admin/organizer actions
        if (this.user.role === 'ADMIN' || event.organizer.id === this.user.id) {
            if (this.user.role === 'ADMIN' && !event.approved) {
                actions += `
                    <button class="btn btn-success btn-sm" onclick="app.approveEvent('${event.id}')">
                        <i class="fas fa-check-circle"></i>
                        Approve
                    </button>
                `;
            }
            actions += `
                <button class="btn btn-primary btn-sm" onclick="app.editEvent('${event.id}')">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="app.deleteEvent('${event.id}')">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            `;
        }
        
        return actions;
    }

    renderEmptyState(type) {
        const emptyStates = {
            events: `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-calendar-plus"></i>
                    </div>
                    <h3>No Events Yet</h3>
                    <p>Create your first event to get started with EventFlow Pro</p>
                    <button class="btn btn-primary" onclick="app.showCreateEventModal()">
                        <i class="fas fa-plus"></i>
                        Create Your First Event
                    </button>
                </div>
            `,
            'filtered-events': `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>No Events Found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                    <button class="btn btn-outline" onclick="app.clearFilters()">
                        Clear Filters
                    </button>
                </div>
            `
        };

        return emptyStates[type] || emptyStates.events;
    }

    // ===== DASHBOARD SYSTEM =====
    async loadDashboard() {
        if (!this.user) return;
        
        this.updateDashboardStats();
        this.renderRecentActivity();
        this.renderUpcomingEvents();
        this.renderPerformanceChart();
    }

    updateDashboardStats() {
        const totalEvents = this.events.length;
        const totalAttendees = this.events.reduce((sum, event) => sum + event.rsvps.length, 0);
        const upcomingEvents = this.events.filter(event => new Date(event.date) > new Date()).length;
        const attendanceRate = totalEvents > 0 ? Math.round((totalAttendees / (totalEvents * 10)) * 100) : 0; // Simplified calculation

        document.getElementById('total-events').textContent = totalEvents.toLocaleString();
        document.getElementById('total-attendees').textContent = totalAttendees.toLocaleString();
        document.getElementById('upcoming-events-count').textContent = upcomingEvents.toLocaleString();
        document.getElementById('attendance-rate').textContent = `${attendanceRate}%`;

        // Update mini metrics
        document.getElementById('avg-attendance').textContent = totalEvents > 0 ? Math.round(totalAttendees / totalEvents) : 0;
        document.getElementById('completion-rate').textContent = '92%'; // Placeholder
        document.getElementById('satisfaction-score').textContent = '4.8'; // Placeholder
    }

    renderRecentActivity() {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        const recentEvents = this.events
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (recentEvents.length === 0) {
            container.innerHTML = '<div class="activity-empty"><i class="fas fa-calendar-plus"></i><p>No recent activity</p></div>';
            return;
        }

        container.innerHTML = recentEvents.map(event => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-calendar-plus"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${this.escapeHtml(event.title)}</div>
                    <div class="activity-meta">
                        Created ${this.formatRelativeTime(event.createdAt)} • ${event.rsvps.length} RSVPs
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderUpcomingEvents() {
        const container = document.getElementById('upcoming-events');
        if (!container) return;

        const upcomingEvents = this.events
            .filter(event => new Date(event.date) > new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        if (upcomingEvents.length === 0) {
            container.innerHTML = '<div class="timeline-empty"><i class="fas fa-clock"></i><p>No upcoming events</p></div>';
            return;
        }

        container.innerHTML = upcomingEvents.map(event => `
            <div class="timeline-item">
                <div class="timeline-date">
                    <div class="date-day">${new Date(event.date).getDate()}</div>
                    <div class="date-month">${new Date(event.date).toLocaleDateString('en', { month: 'short' })}</div>
                </div>
                <div class="timeline-content">
                    <div class="timeline-title">${this.escapeHtml(event.title)}</div>
                    <div class="timeline-meta">
                        <i class="fas fa-clock"></i>
                        ${this.formatTime(event.date)} • ${this.escapeHtml(event.location)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPerformanceChart() {
        const ctx = document.getElementById('performance-chart');
        if (!ctx) return;

        // Simple chart implementation - in a real app, you'd use Chart.js with real data
        ctx.innerHTML = `
            <div class="chart-placeholder">
                <i class="fas fa-chart-line"></i>
                <p>Performance analytics will be displayed here</p>
                <small>Chart.js integration ready</small>
            </div>
        `;
    }

    // ===== SEARCH & FILTER SYSTEM =====
    searchEvents(query) {
        if (!query.trim()) {
            this.filteredEvents = null;
            this.renderEvents();
            return;
        }

        const searchTerm = query.toLowerCase();
        this.filteredEvents = this.events.filter(event =>
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm) ||
            event.organizer.email.toLowerCase().includes(searchTerm)
        );

        this.renderEvents();
        this.trackEvent('events_searched', { query: query, results: this.filteredEvents.length });
    }

    filterEvents(filter) {
        switch (filter) {
            case 'upcoming':
                this.filteredEvents = this.events.filter(event => new Date(event.date) > new Date());
                break;
            case 'past':
                this.filteredEvents = this.events.filter(event => new Date(event.date) <= new Date());
                break;
            case 'my-events':
                this.filteredEvents = this.events.filter(event => event.organizer.id === this.user.id);
                break;
            case 'pending':
                this.filteredEvents = this.events.filter(event => !event.approved);
                break;
            default:
                this.filteredEvents = null;
        }

        this.renderEvents();
        this.trackEvent('events_filtered', { filter: filter, results: this.filteredEvents?.length || this.events.length });
    }

    clearFilters() {
        this.filteredEvents = null;
        document.getElementById('event-search').value = '';
        document.getElementById('event-filter').value = 'all';
        this.renderEvents();
    }

    // ===== UTILITY METHODS =====
    debounce(func, wait) {
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

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
        return this.formatDate(dateString);
    }

    formatCategory(category) {
        const categories = {
            conference: 'Conference',
            workshop: 'Workshop',
            meetup: 'Meetup',
            social: 'Social Event',
            training: 'Training',
            webinar: 'Webinar',
            other: 'Other'
        };
        return categories[category] || category;
    }

    formatUserRole(role) {
        const roles = {
            ADMIN: 'Administrator',
            ORGANIZER: 'Event Organizer',
            ATTENDEE: 'Event Attendee'
        };
        return roles[role] || role;
    }

    updateEventsCount() {
        const eventsCount = document.getElementById('events-count');
        if (eventsCount) {
            eventsCount.textContent = this.events.length;
        }
    }

    updateFilteredEventsCount(count) {
        const countElement = document.getElementById('filtered-events-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    // ===== NOTIFICATION SYSTEM =====
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const id = 'toast-' + Date.now();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = id;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${this.getToastTitle(type)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.getElementById(id)) {
                toast.remove();
            }
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getToastTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || 'Information';
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }

    // ===== ANALYTICS & TRACKING =====
    trackEvent(eventName, properties = {}) {
        // In a real application, you'd send this to your analytics service
        console.log('📊 Event tracked:', eventName, {
            ...properties,
            userId: this.user?.id,
            userRole: this.user?.role,
            timestamp: new Date().toISOString()
        });
    }

    // ===== PLACEHOLDER METHODS =====
    showQuickEventModal() {
        this.showToast('Quick event feature coming soon!', 'info');
    }

    showSearchModal() {
        this.showToast('Advanced search feature coming soon!', 'info');
    }

    showProfileModal() {
        this.showToast('Profile management coming soon!', 'info');
        this.hideUserMenu();
    }

    showNotificationsPanel() {
        this.showToast('Notifications panel coming soon!', 'info');
        this.hideUserMenu();
    }

    editEvent(eventId) {
        this.showToast('Event editing feature coming soon!', 'info');
    }

    loadAnalytics() {
        this.showToast('Advanced analytics loading...', 'info');
        // Analytics implementation would go here
    }

    renderCalendar() {
        this.showToast('Calendar view loading...', 'info');
        // Calendar implementation would go here
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EventFlowPro();
    
    // Add global error handler
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
    });
    
    // Add unhandled rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
    });
});