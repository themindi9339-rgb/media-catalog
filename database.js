// Enhanced Local Storage Database for Media Catalog
class MediaDatabase {
    constructor() {
        this.STORAGE_KEY = 'media_catalog_v2';
        this.SYNC_QUEUE_KEY = 'media_sync_queue';
        this.initDatabase();
        this.initSync();
    }
    
    initDatabase() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
            console.log('Database initialized with empty array');
        }
    }
    
    initSync() {
        if (!localStorage.getItem(this.SYNC_QUEUE_KEY)) {
            localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify([]));
        }
    }
    
    // CRUD Operations
    getAll() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        const items = data ? JSON.parse(data) : [];
        return items.sort((a, b) => b.id - a.id); // Newest first
    }
    
    getByType(type) {
        const all = this.getAll();
        return all.filter(item => {
            const itemType = item.type ? item.type.toLowerCase() : '';
            const searchType = type.toLowerCase();
            
            if (searchType === 'music') {
                return itemType.includes('music');
            }
            return itemType === searchType;
        });
    }
    
    getById(id) {
        const all = this.getAll();
        return all.find(item => item.id === id);
    }
    
    addMedia(mediaItem) {
        const all = this.getAll();
        const newItem = {
            id: Date.now(),
            type: mediaItem.type || '',
            title: mediaItem.title || '',
            rating: parseInt(mediaItem.rating) || 0,
            genre: mediaItem.genre || '',
            notes: mediaItem.notes || '',
            dateAdded: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        all.unshift(newItem); // Add to beginning
        this.saveAll(all);
        
        // Add to sync queue for future cloud sync
        this.addToSyncQueue('CREATE', newItem);
        
        // Broadcast update event
        this.broadcastUpdate();
        
        return newItem;
    }
    
    updateMedia(id, updates) {
        const all = this.getAll();
        const index = all.findIndex(item => item.id === id);
        
        if (index !== -1) {
            all[index] = {
                ...all[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveAll(all);
            
            // Add to sync queue
            this.addToSyncQueue('UPDATE', all[index]);
            
            // Broadcast update event
            this.broadcastUpdate();
            
            return true;
        }
        return false;
    }
    
    deleteMedia(id) {
        const all = this.getAll();
        const itemToDelete = all.find(item => item.id === id);
        const filtered = all.filter(item => item.id !== id);
        
        if (filtered.length !== all.length) {
            this.saveAll(filtered);
            
            // Add to sync queue
            if (itemToDelete) {
                this.addToSyncQueue('DELETE', { id, ...itemToDelete });
            }
            
            // Broadcast update event
            this.broadcastUpdate();
            
            return true;
        }
        return false;
    }
    
    // Statistics
    getCounts() {
        const all = this.getAll();
        return {
            movies: all.filter(item => item.type && item.type.toLowerCase() === 'movie').length,
            music: all.filter(item => item.type && item.type.toLowerCase().includes('music')).length,
            novels: all.filter(item => item.type && item.type.toLowerCase() === 'novel').length,
            total: all.length
        };
    }
    
    getStats() {
        const all = this.getAll();
        const counts = this.getCounts();
        
        // Calculate average ratings
        const movies = all.filter(item => item.type && item.type.toLowerCase() === 'movie');
        const music = all.filter(item => item.type && item.type.toLowerCase().includes('music'));
        const novels = all.filter(item => item.type && item.type.toLowerCase() === 'novel');
        
        const avgRating = (items) => {
            const rated = items.filter(item => item.rating > 0);
            if (rated.length === 0) return 0;
            const sum = rated.reduce((acc, item) => acc + item.rating, 0);
            return (sum / rated.length).toFixed(1);
        };
        
        return {
            counts,
            avgMovieRating: avgRating(movies),
            avgMusicRating: avgRating(music),
            avgNovelRating: avgRating(novels),
            lastUpdated: all.length > 0 ? all[0].createdAt : null
        };
    }
    
    // Search functionality
    search(query) {
        const all = this.getAll();
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) return all;
        
        return all.filter(item => 
            (item.title && item.title.toLowerCase().includes(searchTerm)) ||
            (item.genre && item.genre.toLowerCase().includes(searchTerm)) ||
            (item.notes && item.notes.toLowerCase().includes(searchTerm))
        );
    }
    
    // Export/Import
    exportData() {
        const data = this.getAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        return url;
    }
    
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (Array.isArray(data)) {
                // Merge with existing data, avoiding duplicates
                const existing = this.getAll();
                const existingIds = new Set(existing.map(item => item.id));
                const newItems = data.filter(item => !existingIds.has(item.id));
                
                const all = [...newItems, ...existing];
                this.saveAll(all);
                
                this.broadcastUpdate();
                return { success: true, imported: newItems.length };
            }
            return { success: false, error: 'Invalid data format' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Sync functionality (for future use)
    addToSyncQueue(action, item) {
        const queue = JSON.parse(localStorage.getItem(this.SYNC_QUEUE_KEY) || '[]');
        queue.push({
            action,
            item,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
    }
    
    clearSyncQueue() {
        localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify([]));
    }
    
    // Event system for real-time updates
    broadcastUpdate() {
        window.dispatchEvent(new CustomEvent('mediaDataChanged'));
    }
    
    // Private methods
    saveAll(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
}

// Create global instance
const mediaDB = new MediaDatabase();