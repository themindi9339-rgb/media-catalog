// ==================== iOS FIX for GitHub Pages ====================
(function() {
  console.log('Initializing Media Catalog PWA with iOS fixes...');
  
  // Detect if we're on GitHub Pages
  const isGitHubPages = window.location.hostname.includes('github.io');
  const repoName = 'media-catalog'; // CHANGE THIS TO YOUR REPO NAME
  
  // Fix URL for GitHub Pages
  if (isGitHubPages) {
    const currentPath = window.location.pathname;
    const shouldBePath = `/${repoName}/`;
    
    // Redirect if at wrong path
    if (currentPath === '/' || currentPath === '' || currentPath === '/index.html') {
      if (!currentPath.includes(repoName)) {
        window.history.replaceState({}, '', shouldBePath);
        console.log('Fixed GitHub Pages URL to:', shouldBePath);
      }
    }
  }
})();

// Main Application JavaScript for Media Catalog PWA
class MediaCatalogApp {
    constructor() {
        this.db = mediaDB;
        this.currentPage = this.getCurrentPage();
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        this.init();
    }
    
    init() {
        console.log('Media Catalog App Initializing...');
        
        // Register service worker for PWA with iOS fix
        this.registerServiceWorker();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize the current page
        this.initPage();
        
        // Check online/offline status
        this.setupOnlineStatus();
        
        // Set up auto-save for forms
        this.setupAutoSave();
        
        // Set up install prompt
        this.setupInstallPrompt();
        
        // iOS specific fixes
        if (this.isIOS) {
            this.applyIOSFixes();
        }
    }
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Different path for GitHub Pages vs local
            let swPath = 'service-worker.js';
            
            if (window.location.hostname.includes('github.io')) {
                swPath = '/media-catalog/service-worker.js'; // CHANGE repo name
            }
            
            navigator.serviceWorker.register(swPath)
                .then(registration => {
                    console.log('Service Worker registered:', registration.scope);
                    
                    // Force update
                    registration.update();
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        console.log('Service Worker update found!');
                    });
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }
    
    applyIOSFixes() {
        console.log('Applying iOS-specific fixes...');
        
        // Fix for iOS viewport height
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        
        window.addEventListener('resize', () => {
            document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        });
        
        // Fix iOS form inputs
        document.querySelectorAll('input, textarea, select').forEach(el => {
            el.addEventListener('focus', () => {
                setTimeout(() => {
                    window.scrollTo(0, 0);
                }, 100);
            });
        });
    }
    
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop();
        return page || 'index.html';
    }
    
    initPage() {
        const page = this.currentPage;
        
        switch(page) {
            case 'index.html':
            case '':
                this.initHomePage();
                break;
            case 'movie.html':
                this.initMoviesPage();
                break;
            case 'music.html':
                this.initMusicPage();
                break;
            case 'novel.html':
                this.initNovelsPage();
                break;
            case 'add-media.html':
                this.initAddMediaPage();
                break;
            case 'profile.html':
                this.initProfilePage();
                break;
        }
        
        // Update all pages
        this.updateStats();
        this.setupSearch();
    }
    
    initHomePage() {
        this.displayRecentItems();
        this.setupQuickActions();
    }
    
    initMoviesPage() {
        this.displayMediaItems('movie');
        this.setupFilters('movie');
    }
    
    initMusicPage() {
        this.displayMediaItems('music');
        this.setupFilters('music');
    }
    
    initNovelsPage() {
        this.displayMediaItems('novel');
        this.setupFilters('novel');
    }
    
    initAddMediaPage() {
        this.setupFormValidation();
        this.setupFormAutoComplete();
    }
    
    initProfilePage() {
        this.displayProfileStats();
        this.setupDataManagement();
    }
    
    displayMediaItems(type) {
        const items = this.db.getByType(type);
        const gridId = `${type}s-grid`;
        const gridElement = document.getElementById(gridId);
        
        if (!gridElement) return;
        
        if (items.length === 0) {
            const icon = this.getIconForType(type);
            gridElement.innerHTML = `
                <div class="empty-state">
                    <i class="${icon}" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>No ${type}s yet</h3>
                    <p>Add your first ${type} to get started!</p>
                    <a href="add-media.html" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fas fa-plus"></i> Add ${type.charAt(0).toUpperCase() + type.slice(1)}
                    </a>
                </div>
            `;
            return;
        }
        
        let html = '';
        items.forEach(item => {
            html += this.createMediaCard(item);
        });
        
        gridElement.innerHTML = html;
        
        // Add event listeners to delete buttons
        setTimeout(() => {
            document.querySelectorAll('.delete-media-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.target.closest('[data-id]').dataset.id);
                    this.deleteMediaItem(id, type);
                });
            });
            
            // Add edit functionality
            document.querySelectorAll('.edit-media-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.target.closest('[data-id]').dataset.id);
                    this.editMediaItem(id);
                });
            });
        }, 100);
    }
    
    createMediaCard(item) {
        const type = item.type.toLowerCase();
        const icon = this.getIconForType(type);
        const bgColor = this.getColorForType(type);
        const stars = this.getStarRating(item.rating);
        const date = new Date(item.dateAdded).toLocaleDateString();
        
        return `
            <div class="media-card" data-id="${item.id}">
                <div class="media-image" style="background: linear-gradient(135deg, ${bgColor}, #2d3748);">
                    <i class="${icon}"></i>
                    ${item.rating > 0 ? `
                    <div class="media-badge">
                        <i class="fas fa-star"></i> ${item.rating}/5
                    </div>
                    ` : ''}
                </div>
                <div class="media-content">
                    <div class="media-header">
                        <h3 class="media-title">
                            <i class="${icon}"></i>
                            ${this.escapeHtml(item.title)}
                        </h3>
                        <div class="media-actions">
                            <button class="btn-small edit-media-btn" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-small delete-media-btn" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="media-meta">
                        ${item.genre ? `
                        <span class="media-tag">
                            <i class="fas fa-tag"></i> ${this.escapeHtml(item.genre)}
                        </span>
                        ` : ''}
                        
                        <span class="media-date">
                            <i class="fas fa-calendar"></i> ${date}
                        </span>
                    </div>
                    
                    ${item.rating > 0 ? `
                    <div class="media-rating">
                        ${stars}
                    </div>
                    ` : ''}
                    
                    ${item.notes ? `
                    <div class="media-notes">
                        <p>${this.escapeHtml(item.notes)}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    deleteMediaItem(id, type) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.db.deleteMedia(id);
            this.displayMediaItems(type);
            this.updateStats();
            this.showNotification('Item deleted successfully', 'success');
        }
    }
    
    editMediaItem(id) {
        const item = this.db.getById(id);
        if (item) {
            this.showEditModal(item);
        }
    }
    
    // Form handling
    setupFormValidation() {
        const form = document.getElementById('add-media-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    }
    
    handleFormSubmit() {
        const type = document.getElementById('media-type').value;
        const title = document.getElementById('media-title').value;
        const rating = document.getElementById('media-rating').value;
        const genre = document.getElementById('media-genre').value;
        const notes = document.getElementById('media-notes').value;
        
        if (!title.trim()) {
            this.showNotification('Please enter a title!', 'error');
            return;
        }
        
        if (!type) {
            this.showNotification('Please select a media type!', 'error');
            return;
        }
        
        const mediaItem = {
            type: type,
            title: title.trim(),
            rating: parseInt(rating) || 0,
            genre: genre.trim(),
            notes: notes.trim()
        };
        
        const result = this.db.addMedia(mediaItem);
        
        if (result) {
            this.showNotification(`Added "${title}" to your collection!`, 'success');
            
            // Clear form
            document.getElementById('add-media-form').reset();
            
            // Redirect after delay
            setTimeout(() => {
                switch(type.toLowerCase()) {
                    case 'movie':
                        window.location.href = 'movie.html';
                        break;
                    case 'music album':
                        window.location.href = 'music.html';
                        break;
                    case 'novel':
                        window.location.href = 'novel.html';
                        break;
                    default:
                        window.location.href = 'index.html';
                }
            }, 1500);
        } else {
            this.showNotification('Error adding media. Please try again.', 'error');
        }
    }
    
    // Stats and updates
    updateStats() {
        const stats = this.db.getStats();
        
        // Update all count elements
        const countElements = {
            'movies-count': stats.counts.movies,
            'music-count': stats.counts.music,
            'novels-count': stats.counts.novels,
            'total-count': stats.counts.total,
            'profile-movies': stats.counts.movies,
            'profile-music': stats.counts.music,
            'profile-novels': stats.counts.novels,
            'profile-total': stats.counts.total,
            'form-movies': stats.counts.movies,
            'form-music': stats.counts.music,
            'form-novels': stats.counts.novels,
            'sidebar-movies': stats.counts.movies,
            'sidebar-music': stats.counts.music,
            'sidebar-novels': stats.counts.novels,
            'stats-movies': stats.counts.movies,
            'stats-music': stats.counts.music,
            'stats-novels': stats.counts.novels,
            'footer-movies': stats.counts.movies,
            'footer-music': stats.counts.music,
            'footer-novels': stats.counts.novels
        };
        
        Object.entries(countElements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
        
        // Update time
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString();
        
        ['last-updated', 'footer-update-time'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = `${dateStr} ${timeStr}`;
        });
    }
    
    // Event listeners
    setupEventListeners() {
        // Listen for data changes
        window.addEventListener('mediaDataChanged', () => {
            this.updateStats();
            this.initPage();
        });
        
        // Setup refresh button
        document.querySelectorAll('[onclick*="fetchData"], [onclick*="refreshData"]').forEach(btn => {
            btn.onclick = () => this.refreshData();
        });
        
        // Setup offline/online indicators
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }
    
    setupOnlineStatus() {
        const isOnline = navigator.onLine;
        this.handleOnlineStatus(isOnline);
    }
    
    handleOnlineStatus(isOnline) {
        const indicator = document.getElementById('online-status');
        if (indicator) {
            indicator.innerHTML = isOnline 
                ? '<i class="fas fa-wifi"></i> Online'
                : '<i class="fas fa-wifi-slash"></i> Offline';
            indicator.className = isOnline ? 'online-status online' : 'online-status offline';
        }
        
        if (!isOnline) {
            this.showNotification('You are offline. Data is saved locally.', 'info', 3000);
        }
    }
    
    // Search functionality
    setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            this.performSearch(query);
        });
    }
    
    performSearch(query) {
        const results = this.db.search(query);
        this.displaySearchResults(results);
    }
    
    displaySearchResults(results) {
        const container = document.getElementById('search-results');
        if (!container) return;
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No results found</h3>
                    <p>Try different search terms</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        results.forEach(item => {
            html += this.createMediaCard(item);
        });
        
        container.innerHTML = html;
    }
    
    // Notifications
    showNotification(message, type = 'info', duration = 3000) {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
    
    showUpdateNotification() {
        this.showNotification('New update available! Refresh the page.', 'info', 5000);
    }
    
    // Helper methods
    getIconForType(type) {
        switch(type.toLowerCase()) {
            case 'movie': return 'fas fa-film';
            case 'music': return 'fas fa-music';
            case 'novel': return 'fas fa-book';
            default: return 'fas fa-question';
        }
    }
    
    getColorForType(type) {
        switch(type.toLowerCase()) {
            case 'movie': return '#f43f5e';
            case 'music': return '#8b5cf6';
            case 'novel': return '#0ea5e9';
            default: return '#4361ee';
        }
    }
    
    getStarRating(rating) {
        const numRating = parseInt(rating) || 0;
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= numRating ? '★' : '☆';
        }
        return stars;
    }
    
    getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    refreshData() {
        this.updateStats();
        this.initPage();
        this.showNotification('Data refreshed!', 'success');
    }
    
    // Missing functions implementation
    setupFormAutoComplete() {
        console.log('Form autocomplete setup');
    }
    
    setupAutoSave() {
        console.log('Auto-save setup');
    }
    
    showEditModal(item) {
        console.log('Edit item:', item);
        alert(`Edit functionality coming soon!\n\nYou can edit:\nTitle: ${item.title}\nType: ${item.type}`);
    }
    
    displayRecentItems() {
        const recentItems = this.db.getAll().slice(0, 6);
        const container = document.getElementById('search-results');
        if (!container) return;
        
        if (recentItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-film"></i>
                    <h3>No media yet</h3>
                    <p>Start by adding some media!</p>
                    <a href="add-media.html" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fas fa-plus"></i> Add Media
                    </a>
                </div>
            `;
            return;
        }
        
        let html = '';
        recentItems.forEach(item => {
            html += this.createMediaCard(item);
        });
        
        container.innerHTML = html;
    }
    
    setupQuickActions() {
        console.log('Quick actions setup');
    }
    
    setupFilters(type) {
        console.log(`Filters setup for ${type}`);
    }
    
    displayProfileStats() {
        console.log('Profile stats displayed');
    }
    
    setupDataManagement() {
        console.log('Data management setup');
    }
    
    // Install PWA prompt
    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            window.deferredPrompt = e;
            
            // Show install button after 3 seconds
            setTimeout(() => {
                this.showInstallButton();
            }, 3000);
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed');
            deferredPrompt = null;
            window.deferredPrompt = null;
            this.showNotification('App installed successfully!', 'success');
            
            // Hide install button
            this.hideInstallButton();
        });
    }
    
    showInstallButton() {
        // Don't show if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }
        
        // Don't show if already exists
        if (document.getElementById('pwa-install-button')) return;
        
        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-button';
        installBtn.innerHTML = `
            <i class="fas fa-download"></i>
            <span>Install App</span>
            <small>For better experience</small>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #pwa-install-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #4361ee, #3a0ca3);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 50px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                box-shadow: 0 4px 15px rgba(67, 97, 238, 0.3);
                z-index: 10000;
                transition: all 0.3s ease;
                font-family: 'Poppins', sans-serif;
                min-width: 140px;
            }
            
            #pwa-install-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 20px rgba(67, 97, 238, 0.4);
            }
            
            #pwa-install-button small {
                font-weight: 400;
                font-size: 0.7rem;
                opacity: 0.9;
            }
        `;
        
        installBtn.onclick = () => {
            if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
                window.deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted install');
                    }
                    window.deferredPrompt = null;
                });
            }
        };
        
        document.head.appendChild(style);
        document.body.appendChild(installBtn);
        
        // Auto-hide after 30 seconds
        setTimeout(() => {
            this.hideInstallButton();
        }, 30000);
    }
    
    hideInstallButton() {
        const button = document.getElementById('pwa-install-button');
        if (button) {
            button.remove();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MediaCatalogApp();
    
    // Make app methods globally available
    window.addMedia = (e) => {
        e.preventDefault();
        window.app.handleFormSubmit();
    };
    
    window.deleteMediaItem = (id, type) => window.app.deleteMediaItem(id, type);
    window.refreshData = () => window.app.refreshData();
    window.fetchData = () => window.app.refreshData();
    window.showData = () => console.log('Data:', mediaDB.getAll());
});

// Export/Import functions
window.exportData = function() {
    const data = mediaDB.getAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `media-catalog-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (window.app) {
        window.app.showNotification('Data exported successfully!', 'success');
    }
};

window.importData = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const result = mediaDB.importData(event.target.result);
            if (result.success) {
                if (window.app) {
                    window.app.showNotification(`Imported ${result.imported} items successfully!`, 'success');
                    window.dispatchEvent(new CustomEvent('mediaDataChanged'));
                }
            } else {
                if (window.app) {
                    window.app.showNotification(`Import failed: ${result.error}`, 'error');
                }
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
};

window.clearAllData = function() {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
        localStorage.clear();
        if (window.app) {
            window.app.showNotification('All data cleared. Refreshing...', 'warning');
        }
        setTimeout(() => location.reload(), 1000);
    }
};