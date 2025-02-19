'use strict';

// navbar variables
const nav = document.querySelector('.mobile-nav');
const navMenuBtn = document.querySelector('.nav-menu-btn');
const navCloseBtn = document.querySelector('.nav-close-btn');


// navToggle function
const navToggleFunc = function () { nav.classList.toggle('active'); }

navMenuBtn.addEventListener('click', navToggleFunc);
navCloseBtn.addEventListener('click', navToggleFunc);



// theme toggle variables
const themeBtn = document.querySelectorAll('.theme-btn');


for (let i = 0; i < themeBtn.length; i++) {

  themeBtn[i].addEventListener('click', function () {

    // toggle `light-theme` & `dark-theme` class from `body`
    // when clicked `theme-btn`
    document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme');

    for (let i = 0; i < themeBtn.length; i++) {

      // When the `theme-btn` is clicked,
      // it toggles classes between `light` & `dark` for all `theme-btn`.
      themeBtn[i].classList.toggle('light');
      themeBtn[i].classList.toggle('dark');

    }

  })

}

// Add lazy loading for images
document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('.blog-banner-img');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.addEventListener('load', () => {
          img.removeAttribute('loading');
        });
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => {
    img.setAttribute('loading', 'lazy');
    img.dataset.src = img.src;
    img.src = '';
    imageObserver.observe(img);
  });
});

// Add smooth theme transition
document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

// Wait for DOM content to load
document.addEventListener('DOMContentLoaded', function() {
    initializeThemeToggle();
    initializeSearch();
    initializeNavigation();
});

function initializeThemeToggle() {
    const themeToggleBtn = document.querySelector('.theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            document.body.classList.toggle('light-theme');
            document.body.classList.toggle('dark-theme');
        });
    }
}

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (searchInput && searchResults) {
        let timeoutId;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const query = this.value.trim();
                if (query.length > 2) {
                    performSearch(query);
                } else {
                    searchResults.style.display = 'none';
                }
            }, 300);
        });

        // Close search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }
}

function initializeNavigation() {
    const navItems = document.querySelectorAll('.navbar-link');
    navItems.forEach(item => {
        if (item) {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            });
        }
    });
}

async function performSearch(query) {
    // Implement your search logic here
    console.log('Searching for:', query);
}

// Add Infinite Scroll functionality
class InfiniteScroll {
  constructor() {
    this.page = 1;
    this.loading = false;
    this.allPostsLoaded = false;
    this.postsPerPage = 5;
    this.blogContainer = document.querySelector('.blog-card-group');
    this.statusElement = document.querySelector('.infinite-scroll-status');
    this.loadingElement = this.statusElement.querySelector('.loader');
    this.endMessage = this.statusElement.querySelector('.end-message');
    
    // Store all initial posts
    this.allPosts = Array.from(this.blogContainer.querySelectorAll('.blog-card'));
    
    // Remove all but first page of posts
    this.initializePosts();
    
    // Setup intersection observer
    this.setupObserver();
    
    // Bind scroll handler
    this.handleScroll = this.handleScroll.bind(this);
    window.addEventListener('scroll', this.handleScroll);
  }

  initializePosts() {
    // Keep only the first page of posts
    const initialPosts = this.allPosts.slice(0, this.postsPerPage);
    this.blogContainer.innerHTML = '';
    initialPosts.forEach(post => this.blogContainer.appendChild(post.cloneNode(true)));
  }

  setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.loading && !this.allPostsLoaded) {
          this.loadMorePosts();
        }
      });
    }, {
      rootMargin: '100px'
    });

    // Observe the status element
    this.observer.observe(this.statusElement);
  }

  async handleScroll() {
    // Calculate distance from bottom
    const distanceToBottom = document.documentElement.scrollHeight - 
                           (window.innerHeight + window.scrollY);
    
    if (distanceToBottom < 200 && !this.loading && !this.allPostsLoaded) {
      await this.loadMorePosts();
    }
  }

  async loadMorePosts() {
    this.loading = true;
    this.statusElement.hidden = false;
    this.loadingElement.style.display = 'flex';
    this.endMessage.style.display = 'none';

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const startIndex = this.page * this.postsPerPage;
    const endIndex = startIndex + this.postsPerPage;
    const nextPosts = this.allPosts.slice(startIndex, endIndex);

    if (nextPosts.length === 0) {
      this.allPostsLoaded = true;
      this.loadingElement.style.display = 'none';
      this.endMessage.style.display = 'block';
      window.removeEventListener('scroll', this.handleScroll);
      return;
    }

    // Add new posts with animation
    nextPosts.forEach((post, index) => {
      const newPost = post.cloneNode(true);
      newPost.style.animationDelay = `${index * 0.1}s`;
      this.blogContainer.appendChild(newPost);
    });

    this.page++;
    this.loading = false;
    this.loadingElement.style.display = 'none';

    // Update search index if search is implemented
    if (window.blogSearch) {
      window.blogSearch.updateSearchIndex();
    }
  }
}

// Add authentication and modal handling
class BlogPlatform {
  constructor() {
    this.initializeAuth();
    this.initializeModals();
    this.setupEventListeners();
  }

  initializeAuth() {
    this.isLoggedIn = false;
    this.currentUser = null;
  }

  initializeModals() {
    // Create modal HTML
    const modalHTML = `
      <div class="modal-overlay"></div>
      <div class="auth-modal" id="authModal">
        <h2>Welcome to BlogHub</h2>
        <div class="auth-tabs">
          <button class="tab-btn active" data-tab="login">Sign In</button>
          <button class="tab-btn" data-tab="register">Register</button>
        </div>
        <form id="authForm">
          <!-- Form fields will be injected here -->
        </form>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  setupEventListeners() {
    // Auth buttons
    document.querySelector('.login-btn').addEventListener('click', () => this.showAuthModal('login'));
    document.querySelector('.register-btn').addEventListener('click', () => this.showAuthModal('register'));
    document.querySelector('.write-btn').addEventListener('click', () => this.handleWriteClick());
    
    // Modal events
    document.querySelector('.modal-overlay').addEventListener('click', () => this.hideAuthModal());
    
    // Topic tags
    document.querySelectorAll('.topic-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleTopicClick(e.target.textContent);
      });
    });
  }

  showAuthModal(type) {
    const modal = document.getElementById('authModal');
    const overlay = document.querySelector('.modal-overlay');
    
    this.updateAuthForm(type);
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
  }

  hideAuthModal() {
    const modal = document.getElementById('authModal');
    const overlay = document.querySelector('.modal-overlay');
    
    modal.style.display = 'none';
    overlay.style.display = 'none';
  }

  updateAuthForm(type) {
    const form = document.getElementById('authForm');
    const isLogin = type === 'login';
    
    form.innerHTML = `
      ${!isLogin ? '<input type="text" placeholder="Full Name" required>' : ''}
      <input type="email" placeholder="Email" required>
      <input type="password" placeholder="Password" required>
      <button type="submit" class="btn btn-primary">
        ${isLogin ? 'Sign In' : 'Create Account'}
      </button>
    `;
  }

  handleWriteClick() {
    if (!this.isLoggedIn) {
      this.showAuthModal('register');
      return;
    }
    // Handle write post logic
  }

  handleTopicClick(topic) {
    // Filter posts by topic
    console.log(`Filtering by topic: ${topic}`);
  }
}

// Initialize platform features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.blogPlatform = new BlogPlatform();
  window.blogSearch = new BlogSearch();
  window.infiniteScroll = new InfiniteScroll();
});

// Add highlight animation to style.css
const style = document.createElement('style');
style.textContent = `
  @keyframes highlight {
    0% { background-color: var(--accent); }
    100% { background-color: transparent; }
  }
`;
document.head.appendChild(style);

// Add smooth scroll padding for fixed header
document.documentElement.style.scrollPadding = '80px';

// Add intersection observer for navbar shadow
const navbar = document.querySelector('.navbar');
const header = document.querySelector('header');

const headerObserver = new IntersectionObserver(
  ([entry]) => {
    navbar.classList.toggle('scrolled', !entry.isIntersecting);
  },
  { threshold: 0.9 }
);

headerObserver.observe(header);

// Add hover animation for buttons
document.querySelectorAll('.btn').forEach(button => {
  button.addEventListener('mouseenter', (e) => {
    const x = e.clientX - button.getBoundingClientRect().left;
    const y = e.clientY - button.getBoundingClientRect().top;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 1000);
  });
});

// Theme toggling functionality
class ThemeManager {
    constructor() {
        this.themeBtn = document.querySelector('.theme-btn');
        
        // Check system preference
        this.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Check saved preference
        this.savedTheme = localStorage.getItem('theme');
        
        // Initialize theme
        this.initializeTheme();
        
        // Add event listeners
        this.themeBtn.addEventListener('click', () => this.toggleTheme());
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!this.savedTheme) {
                this.systemPrefersDark = e.matches;
                this.applyTheme();
            }
        });
    }

    initializeTheme() {
        if (this.savedTheme) {
            document.documentElement.classList.add(`${this.savedTheme}-mode`);
        } else {
            this.applyTheme();
        }
    }

    applyTheme() {
        if (this.systemPrefersDark) {
            document.documentElement.classList.remove('light-mode');
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.classList.add('light-mode');
        }
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark-mode');
        document.documentElement.classList.remove(isDark ? 'dark-mode' : 'light-mode');
        document.documentElement.classList.add(isDark ? 'light-mode' : 'dark-mode');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});

// Hero and Navbar scroll animation
class ScrollManager {
  constructor() {
    this.navbar = document.querySelector('.navbar');
    this.ticking = false;
    this.scrollThreshold = 100;
    
    // Bind the scroll handler
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
  }

  handleScroll() {
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > this.scrollThreshold) {
          this.navbar.classList.add('navbar-shrink');
        } else {
          this.navbar.classList.remove('navbar-shrink');
        }
        
        this.ticking = false;
      });
      
      this.ticking = true;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
  new ScrollManager();
});

// Prevent search form submission
document.querySelector('.search-wrapper').addEventListener('submit', (e) => {
  e.preventDefault();
});

// Add text splitting animation
document.addEventListener('DOMContentLoaded', () => {
  // Split text into words for more granular animation
  const heroText = document.querySelector('.hero-text');
  if (heroText) {
    const words = heroText.textContent.split(' ');
    heroText.innerHTML = words.map((word, i) => 
      `<span style="animation-delay: ${0.8 + (i * 0.1)}s">${word}</span>`
    ).join(' ');
  }
});

class NavbarManager {
  constructor() {
    this.navbar = document.querySelector('.navbar');
    this.scrollThreshold = 100;
    this.isScrolled = false;
    
    // Bind scroll handler
    window.addEventListener('scroll', () => this.handleScroll());
  }

  handleScroll() {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > this.scrollThreshold && !this.isScrolled) {
      this.navbar.classList.add('shrink');
      this.isScrolled = true;
    } else if (currentScroll <= this.scrollThreshold && this.isScrolled) {
      this.navbar.classList.remove('shrink');
      this.isScrolled = false;
    }
  }
}

class SearchManager {
  constructor() {
    this.searchInput = document.getElementById('searchInput');
    this.searchBtn = document.querySelector('.search-btn');
    this.suggestionsContainer = document.createElement('div');
    this.suggestionsContainer.className = 'search-suggestions';
    
    // Add suggestions container
    this.searchInput.parentNode.appendChild(this.suggestionsContainer);
    
    // Sample blog data (replace with your actual data)
    this.blogs = [
      {
        title: "Getting Started with Web Development",
        preview: "Learn the basics of HTML, CSS, and JavaScript...",
        url: "/blog/web-dev-basics"
      },
      {
        title: "Advanced JavaScript Concepts",
        preview: "Deep dive into closures, promises, and async/await...",
        url: "/blog/advanced-js"
      },
      {
        title: "CSS Grid Layout Guide",
        preview: "Master modern CSS layouts with Grid...",
        url: "/blog/css-grid"
      }
    ];

    // Event listeners
    this.searchInput.addEventListener('input', () => this.handleSearch());
    this.searchInput.addEventListener('focus', () => this.handleSearch());
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target) && !this.suggestionsContainer.contains(e.target)) {
        this.hideSuggestions();
      }
    });
  }

  handleSearch() {
    const query = this.searchInput.value.trim().toLowerCase();
    
    if (query.length < 2) {
      this.hideSuggestions();
      return;
    }

    const matches = this.blogs.filter(blog => 
      blog.title.toLowerCase().includes(query) ||
      blog.preview.toLowerCase().includes(query)
    );

    this.displaySuggestions(matches);
  }

  displaySuggestions(matches) {
    if (!matches.length) {
      this.suggestionsContainer.innerHTML = `
        <div class="suggestion-item">
          <div class="suggestion-title">No results found</div>
        </div>`;
    } else {
      this.suggestionsContainer.innerHTML = matches
        .map(blog => `
          <a href="${blog.url}" class="suggestion-item">
            <div>
              <div class="suggestion-title">${blog.title}</div>
              <div class="suggestion-preview">${blog.preview}</div>
            </div>
          </a>
        `).join('');
    }
    
    this.showSuggestions();
  }

  showSuggestions() {
    this.suggestionsContainer.style.display = 'block';
  }

  hideSuggestions() {
    this.suggestionsContainer.style.display = 'none';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new NavbarManager();
  new ThemeManager();
  new SearchManager();
});

class App {
    constructor() {
        this.initializeNavbar();
        this.initializeTheme();
        this.initializeSearch();
    }

    initializeNavbar() {
        const navbar = document.querySelector('.navbar');
        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                navbar.classList.add('shrink');
            } else {
                navbar.classList.remove('shrink');
            }
            
            lastScroll = currentScroll;
        });
    }

    initializeTheme() {
        const themeToggle = document.querySelector('.theme-toggle');
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        document.body.setAttribute('data-theme', savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    initializeSearch() {
        const searchInput = document.querySelector('.search-container input');
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            // Add your search logic here
            console.log('Searching for:', searchTerm);
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});