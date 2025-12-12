
class StickyNotesApp {
    constructor() {
        this.noteCounter = 0;
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.init();
    }

    init() {
        this.createBtn = document.getElementById('createNoteBtn');
        this.pendingNotes = document.getElementById('pending-notes');
        
        this.createBtn.addEventListener('click', () => this.createNote());
        

        // Set up column drag and drop events
        this.setupColumnEvents();
        
        // Load saved state if any
        this.loadState();
        
        // If no saved state, add sample notes for demonstration
        if (this.noteCounter === 0) {
            this.createSampleNotes();
        }
        
        // Initial update of column counters
        this.updateColumnCounters();
        
        // Initialize PWA functionality
        this.initPWA();
    }

    createSampleNotes() {
        const sampleNotes = [
            "Review project requirements",
            "Update documentation", 
            "Schedule team meeting",
            "Deploy to production",
            "Write unit tests"
        ];

        sampleNotes.forEach(noteText => {
            this.createNote(noteText);
        });
    }

    createNote(content = '', column = 'pending') {
        this.noteCounter++;
        const noteId = `note-${this.noteCounter}`;
        
        const noteElement = document.createElement('div');
        noteElement.className = 'sticky-note new';
        noteElement.draggable = true;
        noteElement.id = noteId;
        
        noteElement.innerHTML = `
            <textarea class="sticky-note-content" placeholder="Enter your note here...">${content}</textarea>
        `;

        // Add drag event listeners
        noteElement.addEventListener('dragstart', this.handleDragStart.bind(this));
        noteElement.addEventListener('dragend', this.handleDragEnd.bind(this));
        
        // Add double-click to edit functionality
        noteElement.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('sticky-note-content')) {
                e.target.focus();
                e.target.select();
            }
        });

        // Add content change listener
        const textarea = noteElement.querySelector('.sticky-note-content');
        textarea.addEventListener('input', (e) => {
            // Auto-resize textarea
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
            // Save state when content changes
            this.saveState();
        });

        // Save state when focus is lost
        textarea.addEventListener('blur', () => {
            this.saveState();
        });

        // Auto-resize on load if there's content
        if (content) {
            setTimeout(() => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            }, 10);
        }

        // Add to specified column (default to pending)
        const targetContainer = document.querySelector(`.column[data-status="${column}"] .notes-container`);
        if (targetContainer) {
            targetContainer.appendChild(noteElement);
        } else {
            // Fallback to pending if column doesn't exist
            this.pendingNotes.appendChild(noteElement);
        }
        
        // Trigger auto-resize for new notes
        setTimeout(() => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }, 10);

        // Remove the 'new' class after animation
        setTimeout(() => {
            noteElement.classList.remove('new');
        }, 300);

        // Update column counters
        this.updateColumnCounters();
        
        // Save state after creating note
        this.saveState();

        return noteElement;
    }

    handleDragStart(e) {
        const note = e.target;
        note.classList.add('dragging');
        
        // Set drag data
        e.dataTransfer.setData('text/html', note.outerHTML);
        e.dataTransfer.setData('text/plain', note.id);
        e.dataTransfer.effectAllowed = 'move';
    }

    handleDragEnd(e) {
        const note = e.target;
        note.classList.remove('dragging');
        
        // Remove drag-over class from all columns
        document.querySelectorAll('.column').forEach(column => {
            column.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const column = e.currentTarget;
        column.classList.add('drag-over');
    }

    handleDragLeave(e) {
        const column = e.currentTarget;
        // Only remove if we're actually leaving the column (not moving to a child element)
        if (!column.contains(e.relatedTarget)) {
            column.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        
        const column = e.currentTarget;
        const targetStatus = column.dataset.status;
        
        // Remove drag-over class
        column.classList.remove('drag-over');
        
        // Get the dragged note ID
        const noteId = e.dataTransfer.getData('text/plain');
        const note = document.getElementById(noteId);
        
        if (note) {
            // Move the note to the target column
            const targetContainer = column.querySelector('.notes-container');
            targetContainer.appendChild(note);
            
            // Add a small animation to show the move
            note.style.transform = 'scale(0.95)';
            setTimeout(() => {
                note.style.transform = '';
            }, 150);
            
            // Update column counters
            this.updateColumnCounters();
            
            // Save state after moving note
            this.saveState();
        }
    }

    // Update column counters
    updateColumnCounters() {
        const columns = ['pending', 'doing', 'done'];
        
        columns.forEach(status => {
            const notesContainer = document.querySelector(`.column[data-status="${status}"] .notes-container`);
            const counterElement = document.getElementById(`${status}-count`);
            
            if (notesContainer && counterElement) {
                const noteCount = notesContainer.querySelectorAll('.sticky-note').length;
                counterElement.textContent = noteCount;
                
                // Add visual feedback for counter changes
                counterElement.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    counterElement.style.transform = 'scale(1)';
                }, 150);
            }
        });
    }

    // Save current state to localStorage
    saveState() {
        const state = {
            noteCounter: this.noteCounter,
            notes: []
        };

        // Save all notes with their content and position
        const allNotes = document.querySelectorAll('.sticky-note');
        allNotes.forEach(note => {
            const noteId = note.id;
            const content = note.querySelector('.sticky-note-content').value;
            const column = note.parentElement.parentElement.dataset.status;
            
            state.notes.push({
                id: noteId,
                content: content,
                column: column
            });
        });

        localStorage.setItem('stickyNotesApp', JSON.stringify(state));
    }

    // Load state from localStorage
    loadState() {
        const savedState = localStorage.getItem('stickyNotesApp');
        
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.noteCounter = state.noteCounter || 0;
                
                // Recreate all saved notes
                if (state.notes && state.notes.length > 0) {
                    state.notes.forEach(noteData => {
                        this.createNote(noteData.content, noteData.column);
                    });
                }
            } catch (e) {
                console.error('Error loading saved state:', e);
                // If there's an error, start fresh
                this.noteCounter = 0;
            }
        }
    }


    // Add column event listeners
    setupColumnEvents() {
        const columns = document.querySelectorAll('.column');
        
        columns.forEach(column => {
            column.addEventListener('dragover', this.handleDragOver.bind(this));
            column.addEventListener('dragleave', this.handleDragLeave.bind(this));
            column.addEventListener('drop', this.handleDrop.bind(this));
        });
    }

    // PWA Installation and Service Worker functionality

    initPWA() {
        this.registerServiceWorker();
        this.setupPWAEvents();
        this.checkInstallStatus();
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered successfully:', registration);
                
                // Listen for service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateNotification();
                            }
                        });
                    }
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    setupPWAEvents() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA: Install prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Listen for successful installation
        window.addEventListener('appinstalled', (e) => {
            console.log('PWA: App was installed');
            this.isInstalled = true;
            this.hideInstallButton();
            this.deferredPrompt = null;
            this.showInstalledNotification();
        });

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
        }
    }

    showInstallButton() {
        if (!this.isInstalled && !document.getElementById('install-btn')) {
            const installBtn = document.createElement('button');
            installBtn.id = 'install-btn';
            installBtn.className = 'install-btn';
            installBtn.innerHTML = `
                <i class="fas fa-download"></i>
                <span>Install App</span>
            `;
            installBtn.addEventListener('click', () => this.installApp());
            
            // Add to header
            const header = document.querySelector('.app-header');
            if (header) {
                header.appendChild(installBtn);
            }
        }
    }

    hideInstallButton() {
        const installBtn = document.getElementById('install-btn');
        if (installBtn) {
            installBtn.remove();
        }
    }

    async installApp() {
        if (this.deferredPrompt) {
            try {
                // Show the install prompt
                const result = await this.deferredPrompt.prompt();
                console.log('PWA: Install prompt result:', result);
                
                // The deferredPrompt can only be used once
                this.deferredPrompt = null;
            } catch (error) {
                console.error('PWA: Install failed:', error);
            }
        } else {
            // Fallback for browsers that don't support the install prompt
            this.showManualInstallInstructions();
        }
    }

    checkInstallStatus() {
        // Check if running in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = window.navigator.standalone === true;
        
        if (isStandalone || isIOSStandalone) {
            this.isInstalled = true;
            this.hideInstallButton();
        }
    }

    showUpdateNotification() {
        // Create a notification about app update
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <i class="fas fa-sync-alt"></i>
                <span>App updated! Refresh to use the latest version.</span>
                <button class="refresh-btn">Refresh</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add event listener for refresh button
        const refreshBtn = notification.querySelector('.refresh-btn');
        refreshBtn.addEventListener('click', () => {
            window.location.reload();
        });
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            notification.remove();
        }, 10000);
    }

    showInstalledNotification() {
        const notification = document.createElement('div');
        notification.className = 'installed-notification';
        notification.innerHTML = `
            <div class="installed-content">
                <i class="fas fa-check-circle"></i>
                <span>App installed successfully!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showManualInstallInstructions() {
        const instructions = `
            To install this app:
            ${this.getPlatformInstructions()}
        `;
        
        alert(instructions);
    }

    getPlatformInstructions() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('android')) {
            return "• Tap the menu (⋮) in your browser\n• Select 'Add to Home screen' or 'Install app'";
        } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
            return "• Tap the Share button (□↑)\n• Scroll down and tap 'Add to Home Screen'";
        } else if (userAgent.includes('mac')) {
            return "• Click 'File' in your browser menu\n• Select 'Add to Dock'";
        } else {
            return "• Look for 'Install' or 'Add to Home screen' in your browser's menu";
        }
    }

    // Clear all saved data (for testing or reset functionality)
    clearSavedData() {
        localStorage.removeItem('stickyNotesApp');
        location.reload();
    }

    // Get app statistics
    getStats() {
        const stats = {
            total: 0,
            pending: 0,
            doing: 0,
            done: 0
        };

        document.querySelectorAll('.sticky-note').forEach(note => {
            const column = note.parentElement.parentElement.dataset.status;
            stats.total++;
            stats[column]++;
        });

        return stats;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new StickyNotesApp();
    app.setupColumnEvents();
    
    // Add global keyboard shortcut for clearing data (Ctrl+Shift+C for testing)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            if (confirm('This will clear all your saved notes. Are you sure?')) {
                app.clearSavedData();
            }
        }
    });

    // Add keyboard shortcut to show stats (Ctrl+Shift+S)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
            const stats = app.getStats();
            alert(`App Statistics:\n\nTotal Notes: ${stats.total}\nPending: ${stats.pending}\nIn Progress: ${stats.doing}\nCompleted: ${stats.done}`);
        }
    });
});

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+N or Cmd+N to create new note
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('createNoteBtn').click();
    }
    
    // Escape key to clear selection/focus
    if (e.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('sticky-note-content')) {
            activeElement.blur();
        }
    }
});

// Add visibility change handler to save state when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Save state when tab becomes hidden
        const app = window.stickyNotesApp;
        if (app) {
            app.saveState();
        }
    }
});

// Store app instance globally for access by other functions
window.addEventListener('load', () => {
    // Make app globally accessible for debugging
    if (window.app) {
        window.stickyNotesApp = window.app;
    }
});
