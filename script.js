document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle functionality (shared across all pages)
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon i');
    
    if (themeToggle) {
        // Theme toggling functionality
        themeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                if (themeIcon) {
                    themeIcon.className = 'fas fa-moon'; // Change to moon icon in light mode
                }
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if (themeIcon) {
                    themeIcon.className = 'fas fa-sun'; // Change to sun icon in dark mode
                }
            }
        });
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.checked = false;
            if (themeIcon) {
                themeIcon.className = 'fas fa-sun'; // Set to sun icon in dark mode
            }
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.checked = true;
            if (themeIcon) {
                themeIcon.className = 'fas fa-moon'; // Set to moon icon in light mode
            }
        }
    }

    // Smooth scroll functionality for scroll indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const projectsSection = document.getElementById('projects');
            if (projectsSection) {
                projectsSection.scrollIntoView({ 
                    behavior: 'smooth' 
                });
            }
        });
    }

    // Cursor dot animation (only on index page)
    const cursorDot = document.getElementById('cursor-dot');
    
    if (!cursorDot) {
        // This is normal for other pages, so don't show error
        return;
    }

    // Set initial styles with flat colors
    anime.set(cursorDot, {
        backgroundColor: '#ff6600', // Flat orange
        borderRadius: '50%', // Circle
        scale: 1
    });
    
    // Create timeline for the flat color animation
    const dotTimeline = anime.timeline({
        loop: true,
        easing: 'easeInOutQuad'
    });
    
    // Add different animation segments with flat colors
    
    // 1. Start as a circle, pulse and change color
    dotTimeline.add({
        targets: cursorDot,
        scale: [1, 1.3, 1],
        backgroundColor: ['#ff6600', '#00aaff', '#ff6600'], // Flat orange to flat blue and back
        borderRadius: '50%',
        duration: 600
    });
    
    // 2. Morph to a rounded line
    dotTimeline.add({
        targets: cursorDot,
        scaleX: [1, 1.3],
        scaleY: [1, 0.3],
        backgroundColor: ['#ff6600', '#00cc00'], // Flat orange to flat green
        borderRadius: ['50%', '10px'], // Increased border radius for more rounded appearance
        rotate: [0, 45],
        duration: 400,
        delay: 50
    });
    
    // 3. Wiggle as a rounded line
    dotTimeline.add({
        targets: cursorDot,
        rotate: [45, -15, 45],
        backgroundColor: ['#00cc00', '#cc3300'], // Flat green to flat red
        duration: 800,
        delay: 50
    });
    
    // 4. Morph to a rounded square
    dotTimeline.add({
        targets: cursorDot,
        scaleX: [1.3, 1],
        scaleY: [0.3, 1],
        borderRadius: ['10px', '15px'], // Keep it rounded
        backgroundColor: ['#cc3300', '#ffcc00'], // Flat red to flat yellow
        rotate: [45, 0],
        duration: 400,
        delay: 50
    });
    
    // 5. Bounce as a rounded square
    dotTimeline.add({
        targets: cursorDot,
        scale: [1, 1.1, 0.9, 1],
        backgroundColor: ['#ffcc00', '#9900cc', '#ffcc00'], // Flat yellow to flat purple and back
        borderRadius: '15px', // Maintain rounded corners
        rotate: [0, 90, 180, 270, 360],
        duration: 900
    });
    
    // 6. Return to circle
    dotTimeline.add({
        targets: cursorDot,
        borderRadius: ['15px', '50%'],
        backgroundColor: ['#ffcc00', '#ff6600'], // Flat yellow to flat orange
        rotate: 0,
        duration: 300,
        delay: 50
    });
}); 