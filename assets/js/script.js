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

// Add search functionality
class BlogSearch {
  constructor() {
    this.searchInput = document.getElementById('searchInput');
    this.searchResults = document.getElementById('searchResults');
    this.blogPosts = this.getAllBlogPosts();
    this.setupEventListeners();
  }

  getAllBlogPosts() {
    const posts = [];
    document.querySelectorAll('.blog-card').forEach(card => {
      posts.push({
        title: card.querySelector('.h3').textContent.trim(),
        content: card.querySelector('.blog-text').textContent.trim(),
        topic: card.querySelector('.blog-topic').textContent.trim(),
        element: card
      });
    });
    return posts;
  }

  setupEventListeners() {
    let debounceTimeout;
    
    this.searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => this.handleSearch(), 300);
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.searchResults.contains(e.target) && 
          !this.searchInput.contains(e.target)) {
        this.searchResults.hidden = true;
      }
    });
  }

  handleSearch() {
    const searchTerm = this.searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
      this.searchResults.hidden = true;
      return;
    }

    const results = this.blogPosts.filter(post => 
      post.title.toLowerCase().includes(searchTerm) ||
      post.content.toLowerCase().includes(searchTerm) ||
      post.topic.toLowerCase().includes(searchTerm)
    );

    this.displayResults(results);
  }

  displayResults(results) {
    this.searchResults.innerHTML = '';
    
    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="no-results">
          No results found
        </div>
      `;
    } else {
      results.forEach(post => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
          <h4>${post.title}</h4>
          <p>${post.content.substring(0, 100)}...</p>
        `;
        
        resultItem.addEventListener('click', () => {
          post.element.scrollIntoView({ behavior: 'smooth' });
          post.element.style.animation = 'highlight 2s';
          this.searchResults.hidden = true;
          this.searchInput.value = '';
        });
        
        this.searchResults.appendChild(resultItem);
      });
    }
    
    this.searchResults.hidden = false;
  }

  updateSearchIndex() {
    this.blogPosts = this.getAllBlogPosts();
  }
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
    this.body = document.body;
    this.themeBtn = document.querySelector('.theme-btn');
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.body.classList.add('dark-mode');
    }
    
    // Add click handler
    this.themeBtn.addEventListener('click', () => this.toggleTheme());
  }

  toggleTheme() {
    this.body.classList.toggle('dark-mode');
    const isDark = this.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
}

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
    this.searchResults = [];
    
    this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
  }

  handleSearch(query) {
    // Add your search logic here
    console.log('Searching for:', query);
  }
}

// Initialize everything when DOM is loaded
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