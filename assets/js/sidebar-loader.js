const SIDEBAR_CACHE_KEY = 'netapp-hub-sidebar-cache';
const SIDEBAR_URL = 'assets/includes/sidebar.html';

async function loadSidebarOnce() {
  // Check if sidebar already exists in DOM
  if (document.getElementById('sidebar')) {
    setTimeout(markActivePage, 100);
    return;
  }

  let sidebarHTML = sessionStorage.getItem(SIDEBAR_CACHE_KEY);

  // If not cached, fetch it
  if (!sidebarHTML) {
    try {
      const response = await fetch(SIDEBAR_URL);
      if (!response.ok) throw new Error('Failed to fetch sidebar');
      sidebarHTML = await response.text();
      sessionStorage.setItem(SIDEBAR_CACHE_KEY, sidebarHTML);
    } catch (error) {
      console.error('Failed to load sidebar:', error);
      return;
    }
  }

  // Parse and inject sidebar
  const temp = document.createElement('div');
  temp.innerHTML = sidebarHTML;
  const sidebarElement = temp.firstElementChild;

  // Insert sidebar at the beginning of body (before noise div)
  const noiseDiv = document.querySelector('.noise');
  if (noiseDiv) {
    noiseDiv.insertAdjacentElement('afterend', sidebarElement);
  } else {
    document.body.insertBefore(sidebarElement, document.body.firstChild);
  }

  // Give sidebar time to be in DOM, then mark active page
  setTimeout(markActivePage, 100);
}

/**
 * Mark the current page link as active in the sidebar.
 */
function markActivePage() {
    let currentPath = window.location.pathname.split('/').pop();
    
    // Treat empty path as index.html (when visiting root /)
    if (!currentPath || currentPath === '') {
      currentPath = 'index.html';
    }
  
    console.log('Current path:', currentPath);
  
    const navLinks = document.querySelectorAll('.nav-links a');
    console.log('Found nav links:', navLinks.length);
  
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      const li = link.parentElement;
  
      console.log('Checking link:', href, 'against', currentPath);
  
      // Simple direct match
      const isActive = href === currentPath;
  
      if (isActive) {
        console.log('✓ Match found for:', href);
        li.classList.add('active');
      } else {
        li.classList.remove('active');
      }
    });
  }

/**
 * Toggle sidebar on mobile
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('active');
  }
}

// Load sidebar immediately when script runs
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSidebarOnce);
} else {
  loadSidebarOnce();
}