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

    // Cursor dot animation (only on index page)
    const cursorDot = document.getElementById('cursor-dot');
    
    if (!cursorDot) {
        console.error('Required element #cursor-dot not found!');
        return;
    }

    // Set initial styles
    anime.set(cursorDot, {
        backgroundColor: '#8A2BE2', // BlueViolet
        borderRadius: '50%', // Circle
        scale: 1
    });
    
    // Create timeline for the vibrant animation
    const dotTimeline = anime.timeline({
        loop: true,
        easing: 'easeInOutQuad'
    });
    
    // Add different animation segments
    
    // 1. Start as a circle, pulse and change color
    dotTimeline.add({
        targets: cursorDot,
        scale: [1, 1.3, 1],
        backgroundColor: ['#8A2BE2', '#FF1493', '#8A2BE2'], // BlueViolet to DeepPink and back
        borderRadius: '50%',
        duration: 600
    });
    
    // 2. Morph to a rounded line
    dotTimeline.add({
        targets: cursorDot,
        scaleX: [1, 1.3],
        scaleY: [1, 0.3],
        backgroundColor: ['#8A2BE2', '#00BFFF'], // BlueViolet to DeepSkyBlue
        borderRadius: ['50%', '10px'], // Increased border radius for more rounded appearance
        rotate: [0, 45],
        duration: 400,
        delay: 50
    });
    
    // 3. Wiggle as a rounded line
    dotTimeline.add({
        targets: cursorDot,
        rotate: [45, -15, 45],
        backgroundColor: ['#00BFFF', '#32CD32'], // DeepSkyBlue to LimeGreen
        duration: 800,
        delay: 50
    });
    
    // 4. Morph to a rounded square
    dotTimeline.add({
        targets: cursorDot,
        scaleX: [1.3, 1],
        scaleY: [0.3, 1],
        borderRadius: ['10px', '15px'], // Keep it rounded
        backgroundColor: ['#32CD32', '#FF4500'], // LimeGreen to OrangeRed
        rotate: [45, 0],
        duration: 400,
        delay: 50
    });
    
    // 5. Bounce as a rounded square
    dotTimeline.add({
        targets: cursorDot,
        scale: [1, 1.1, 0.9, 1],
        backgroundColor: ['#FF4500', '#FFD700', '#FF4500'], // OrangeRed to Gold and back
        borderRadius: '15px', // Maintain rounded corners
        rotate: [0, 90, 180, 270, 360],
        duration: 900
    });
    
    // 6. Return to circle
    dotTimeline.add({
        targets: cursorDot,
        borderRadius: ['15px', '50%'],
        backgroundColor: ['#FF4500', '#8A2BE2'], // OrangeRed to BlueViolet
        rotate: 0,
        duration: 300,
        delay: 50
    });
}); 