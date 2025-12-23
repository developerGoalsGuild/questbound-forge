/**
 * GoalsGuild Landing Page - Main JavaScript
 * Handles general functionality across all pages
 */

document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    initMobileMenu();

    // Smooth scrolling for anchor links
    initSmoothScrolling();

    // Waitlist form handling
    initWaitlistForm();

    // Animation on scroll
    initScrollAnimations();
});

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (!menuToggle || !navMenu) return;

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');

        // Update aria-expanded attribute
        const isExpanded = navMenu.classList.contains('active');
        menuToggle.setAttribute('aria-expanded', isExpanded);

        // Animate hamburger icon
        const spans = menuToggle.querySelectorAll('span');
        if (isExpanded) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
        } else {
            spans[0].style.transform = '';
            spans[1].style.opacity = '';
            spans[2].style.transform = '';
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            
            const spans = menuToggle.querySelectorAll('span');
            spans[0].style.transform = '';
            spans[1].style.opacity = '';
            spans[2].style.transform = '';
        }
    });

    // Close menu when clicking on a link
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            
            const spans = menuToggle.querySelectorAll('span');
            spans[0].style.transform = '';
            spans[1].style.opacity = '';
            spans[2].style.transform = '';
        });
    });
}

/**
 * Smooth Scrolling for Anchor Links
 */
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just '#'
            if (href === '#') {
                e.preventDefault();
                return;
            }

            const targetElement = document.querySelector(href);
            
            if (targetElement) {
                e.preventDefault();
                
                const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                const targetPosition = targetElement.offsetTop - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Waitlist Form Handling
 */
function initWaitlistForm() {
    const form = document.getElementById('waitlistForm');
    if (!form) {
        console.error('Waitlist form not found! Looking for element with id="waitlistForm"');
        return;
    }

    console.log('Waitlist form initialized');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');

        const emailInput = form.querySelector('input[type="email"]');
        const button = form.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('formMessage');

        if (!emailInput || !button || !messageDiv) {
            console.error('Form elements not found:', { emailInput: !!emailInput, button: !!button, messageDiv: !!messageDiv });
            return;
        }

        const email = emailInput.value.trim();
        console.log('Email submitted:', email);

        // Validate email
        if (!isValidEmail(email)) {
            console.warn('Invalid email format:', email);
            showMessage(messageDiv, 'Please enter a valid email address.', 'error');
            return;
        }

        // Disable button and show loading state
        const originalButtonText = button.textContent;
        button.textContent = 'Joining...';
        button.disabled = true;

        try {
            // Get API Gateway URL and key from config
            // These are set via a script tag in index.html: <script>window.GOALSGUILD_CONFIG = { apiBaseUrl: '...', apiKey: '...' };</script>
            const apiBaseUrl = window.GOALSGUILD_CONFIG?.apiBaseUrl;
            const apiKey = window.GOALSGUILD_CONFIG?.apiKey;
            
            console.log('API Configuration:', { 
                apiBaseUrl, 
                hasApiKey: !!apiKey,
                configExists: !!window.GOALSGUILD_CONFIG,
                fullConfig: window.GOALSGUILD_CONFIG
            });
            
            if (!apiBaseUrl) {
                console.error('API Base URL not configured!');
                showMessage(messageDiv, 'Configuration error: API URL missing. Please contact support.', 'error');
                return;
            }
            
            if (!apiKey) {
                console.error('API Gateway key not configured!');
                showMessage(messageDiv, 'Configuration error: API key missing. Please contact support.', 'error');
                return;
            }

            const url = `${apiBaseUrl}/waitlist/subscribe`;
            console.log('Making request to:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                },
                body: JSON.stringify({ email }),
            });

            console.log('Response received:', { status: response.status, statusText: response.statusText });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                let errorMessage = errorData.detail || 'Something went wrong. Please try again later.';
                
                // Handle specific error cases
                if (response.status === 429) {
                    errorMessage = errorData.detail || 'Too many requests. Please wait a moment and try again.';
                } else if (response.status === 403) {
                    errorMessage = 'Access denied. Please contact support.';
                } else if (response.status === 400) {
                    errorMessage = errorData.detail || 'Invalid email address.';
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Show success message
            showMessage(
                messageDiv,
                data.message || 'Thank you for joining! We\'ll be in touch soon.',
                'success'
            );

            // Reset form
            form.reset();

        } catch (error) {
            console.error('Error submitting form:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            let errorMessage = 'Something went wrong. Please try again later.';
            if (error.message) {
                errorMessage = error.message;
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            
            showMessage(messageDiv, errorMessage, 'error');
        } finally {
            // Re-enable button
            button.textContent = originalButtonText;
            button.disabled = false;
        }
    });
}

/**
 * Email Validation
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show Form Message
 */
function showMessage(messageDiv, text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `form-message ${type}`;
    
    // Announce to screen readers
    messageDiv.setAttribute('role', 'alert');
    
    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.className = 'form-message';
            messageDiv.textContent = '';
        }, 5000);
    }
}

/**
 * Scroll Animations
 */
function initScrollAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements
    const animatedElements = document.querySelectorAll(
        '.feature-card, .step, .stat, .article-card'
    );

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

/**
 * Navbar Background on Scroll
 */
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    if (window.scrollY > 100) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    }
});

/**
 * Lazy Loading Images
 */
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.dataset.src || img.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

/**
 * Handle External Links
 */
document.querySelectorAll('a[target="_blank"]').forEach(link => {
    // Add rel attributes for security
    if (!link.hasAttribute('rel')) {
        link.setAttribute('rel', 'noopener noreferrer');
    }
});

/**
 * Console Welcome Message
 */
console.log(
    '%cWelcome to GoalsGuild!',
    'font-size: 20px; font-weight: bold; color: #1E5AA8;'
);
console.log(
    '%cInterested in joining our team? Email us at careers@goalsguild.com',
    'font-size: 14px; color: #666;'
);

