/**
 * GoalsGuild Landing Page - Blog Functionality
 * Handles blog article loading, pagination, and filtering
 */

class BlogManager {
    constructor() {
        this.articles = [];
        this.filteredArticles = [];
        this.currentPage = 1;
        this.articlesPerPage = 5;
        this.currentCategory = 'all';
        
        this.articlesContainer = document.getElementById('blogArticles');
        this.paginationContainer = document.getElementById('pagination');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.recentPostsContainer = document.getElementById('recentPosts');

        this.init();
    }

    async init() {
        // Add event listeners for category filters
        this.setupCategoryFilters();

        // Load articles
        await this.loadArticles();

        // Display articles
        this.displayArticles();

        // Setup newsletter form
        this.setupNewsletterForm();
    }

    setupCategoryFilters() {
        const categoryLinks = document.querySelectorAll('[data-category]');
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active state
                categoryLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Filter articles
                this.currentCategory = link.dataset.category;
                this.currentPage = 1;
                this.filterArticles();
                this.displayArticles();
            });
        });
    }

    async loadArticles() {
        try {
            // Try to load manifest.json first
            const response = await fetch('blog/manifest.json');
            
            if (response.ok) {
                const data = await response.json();
                this.articles = data.articles || [];
            } else {
                // Fallback to sample articles if manifest doesn't exist
                this.articles = this.getSampleArticles();
            }

            // Sort by date (newest first)
            this.articles.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            this.filteredArticles = [...this.articles];
            
        } catch (error) {
            console.error('Error loading articles:', error);
            this.articles = this.getSampleArticles();
            this.filteredArticles = [...this.articles];
        } finally {
            this.hideLoading();
        }
    }

    getSampleArticles() {
        // Sample articles for demonstration
        return [
            {
                id: '2025-10-23-welcome-to-goalsguild',
                title: 'Welcome to GoalsGuild: Transform Your Goals into Achievements',
                excerpt: 'We\'re excited to announce the launch of GoalsGuild, a revolutionary platform that combines intelligent collaboration, gamification, and AI-powered guidance to help you achieve your goals.',
                date: '2025-10-23',
                category: 'feature-announcement',
                categoryLabel: 'Feature Announcement',
                url: 'blog/articles/2025-10-23-welcome-to-goalsguild.html'
            },
            {
                id: '2025-10-20-smart-goal-management',
                title: 'Introducing Smart Goal Management with AI Guidance',
                excerpt: 'Learn how our AI-powered goal creation system uses NLP questions to help you define clear, actionable objectives and break them into manageable tasks.',
                date: '2025-10-20',
                category: 'feature-announcement',
                categoryLabel: 'Feature Announcement',
                url: 'blog/articles/2025-10-20-smart-goal-management.html'
            },
            {
                id: '2025-10-15-gamification-engine',
                title: 'Level Up Your Goals: The GoalsGuild Gamification System',
                excerpt: 'Discover how our gamification engine keeps you motivated with XP, levels, badges, and challenges. Stay engaged and celebrate every milestone on your journey to success.',
                date: '2025-10-15',
                category: 'guide',
                categoryLabel: 'Guides & Tips',
                url: 'blog/articles/2025-10-15-gamification-engine.html'
            },
            {
                id: '2025-10-10-intelligent-matching',
                title: 'Find Your Perfect Collaboration Partner',
                excerpt: 'Our intelligent matching algorithm connects you with users who have complementary goals and skills. Learn how AI helps you build the perfect support network.',
                date: '2025-10-10',
                category: 'feature-announcement',
                categoryLabel: 'Feature Announcement',
                url: 'blog/articles/2025-10-10-intelligent-matching.html'
            },
            {
                id: '2025-10-05-success-story-sarah',
                title: 'Success Story: How Sarah Achieved Her Fitness Goals',
                excerpt: 'Meet Sarah, who used GoalsGuild to connect with a fitness partner and lose 30 pounds in 6 months. Read her inspiring journey and tips for success.',
                date: '2025-10-05',
                category: 'success-story',
                categoryLabel: 'Success Stories',
                url: 'blog/articles/2025-10-05-success-story-sarah.html'
            }
        ];
    }

    filterArticles() {
        if (this.currentCategory === 'all') {
            this.filteredArticles = [...this.articles];
        } else {
            this.filteredArticles = this.articles.filter(
                article => article.category === this.currentCategory
            );
        }
    }

    displayArticles() {
        const startIndex = (this.currentPage - 1) * this.articlesPerPage;
        const endIndex = startIndex + this.articlesPerPage;
        const articlesToShow = this.filteredArticles.slice(startIndex, endIndex);

        if (articlesToShow.length === 0) {
            this.showEmptyState();
        } else {
            this.articlesContainer.innerHTML = articlesToShow.map(article => 
                this.createArticleCard(article)
            ).join('');
        }

        this.updatePagination();
        this.updateRecentPosts();
    }

    createArticleCard(article) {
        const formattedDate = new Date(article.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <article class="article-card">
                <div class="article-meta">
                    <time class="article-date" datetime="${article.date}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        ${formattedDate}
                    </time>
                    <span class="article-category">${article.categoryLabel}</span>
                </div>
                <h2>
                    <a href="${article.url}">${article.title}</a>
                </h2>
                <p class="article-excerpt">${article.excerpt}</p>
                <a href="${article.url}" class="read-more">
                    Read More
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </a>
            </article>
        `;
    }

    showEmptyState() {
        this.articlesContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <h3>No articles found</h3>
                <p>Try selecting a different category or check back later for new content.</p>
            </div>
        `;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredArticles.length / this.articlesPerPage);

        if (totalPages <= 1) {
            this.paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <button class="pagination-btn" 
                    ${this.currentPage === 1 ? 'disabled' : ''}
                    onclick="blogManager.goToPage(${this.currentPage - 1})">
                Previous
            </button>
        `;

        // Show page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 || 
                i === totalPages || 
                (i >= this.currentPage - 1 && i <= this.currentPage + 1)
            ) {
                paginationHTML += `
                    <button class="pagination-page ${i === this.currentPage ? 'active' : ''}"
                            onclick="blogManager.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (
                i === this.currentPage - 2 || 
                i === this.currentPage + 2
            ) {
                paginationHTML += '<span>...</span>';
            }
        }

        paginationHTML += `
            <button class="pagination-btn" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}
                    onclick="blogManager.goToPage(${this.currentPage + 1})">
                Next
            </button>
        `;

        this.paginationContainer.innerHTML = paginationHTML;
    }

    updateRecentPosts() {
        const recentArticles = this.articles.slice(0, 5);
        
        this.recentPostsContainer.innerHTML = recentArticles.map(article => {
            const formattedDate = new Date(article.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            return `
                <li class="recent-post-item">
                    <a href="${article.url}">${article.title}</a>
                    <div class="recent-post-date">${formattedDate}</div>
                </li>
            `;
        }).join('');
    }

    goToPage(page) {
        this.currentPage = page;
        this.displayArticles();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
    }

    setupNewsletterForm() {
        const form = document.getElementById('newsletterForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = form.querySelector('input[type="email"]').value;
            const button = form.querySelector('button');
            const originalText = button.textContent;

            button.textContent = 'Subscribing...';
            button.disabled = true;

            // Simulate API call
            setTimeout(() => {
                alert('Thank you for subscribing! You will receive updates about new blog posts.');
                form.reset();
                button.textContent = originalText;
                button.disabled = false;
            }, 1000);
        });
    }
}

// Initialize blog manager when DOM is loaded
let blogManager;
document.addEventListener('DOMContentLoaded', () => {
    blogManager = new BlogManager();
});

