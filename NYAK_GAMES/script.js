// NYAK GAMES - Search & Theme Functionality

document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // THEME TOGGLE FUNCTIONALITY
    // ============================================
    
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('nyak-theme') || 'light';
    
    // Apply saved theme on load (no flash)
    html.setAttribute('data-theme', savedTheme);
    
    // Theme toggle click handler
    themeToggle.addEventListener('click', function() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Apply new theme
        html.setAttribute('data-theme', newTheme);
        
        // Save to localStorage
        localStorage.setItem('nyak-theme', newTheme);
    });
    
    // Keyboard accessibility for toggle
    themeToggle.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            themeToggle.click();
        }
    });
    
    // ============================================
    // SEARCH FUNCTIONALITY
    // ============================================
    
    // Get DOM elements
    const searchInput = document.getElementById('searchInput');
    const gameCards = document.querySelectorAll('.game-card');
    const noResults = document.getElementById('noResults');
    
    // Search function
    function filterGames(searchTerm) {
        // Normalize search term (lowercase, trim)
        const normalizedSearch = searchTerm.toLowerCase().trim();
        
        // Track visible games count
        let visibleGames = 0;
        
        // Loop through all game cards
        gameCards.forEach(card => {
            // Get the data-game attribute (contains searchable keywords)
            const gameKeywords = card.getAttribute('data-game');
            
            // Get the visible title text
            const gameTitle = card.querySelector('.card-title').textContent.toLowerCase();
            
            // Check if search term matches any keywords or title
            if (gameKeywords.includes(normalizedSearch) || 
                gameTitle.includes(normalizedSearch) ||
                normalizedSearch === '') {
                // Show the card
                card.classList.remove('hidden');
                visibleGames++;
            } else {
                // Hide the card
                card.classList.add('hidden');
            }
        });
        
        // Show/hide no results message
        if (visibleGames === 0 && normalizedSearch !== '') {
            noResults.classList.add('visible');
        } else {
            noResults.classList.remove('visible');
        }
    }
    
    // Add event listener for real-time search
    searchInput.addEventListener('input', function(e) {
        filterGames(e.target.value);
    });
    
    // Add keyboard support
    document.addEventListener('keydown', function(e) {
        // ESC to clear search
        if (e.key === 'Escape') {
            searchInput.value = '';
            filterGames('');
            searchInput.blur();
        }
        
        // Focus search on Ctrl/Cmd + K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });
});
