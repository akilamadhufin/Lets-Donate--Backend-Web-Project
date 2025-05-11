document.addEventListener('DOMContentLoaded', () => {
  // Modal Elements
  const modal = document.getElementById('item-modal');
  const closeBtn = modal.querySelector('.close-btn');
  const modalImage = document.getElementById('modal-image');
  const modalTitle = document.getElementById('modal-title');
  const modalDescription = document.getElementById('modal-description');
  const modalCategory = document.getElementById('modal-category');
  const modalPickup = document.getElementById('modal-address');
  const modalDate = document.getElementById('modal-date');
  const messageBox = document.getElementById('message-box');
  const sendBtn = document.getElementById('send-message-btn');
  const mapElement = document.getElementById('map');
  const searchInput = document.getElementById('search-input');
  const bookForm = document.getElementById('book-form');
  const unavailableBtn = document.getElementById('unavailable-btn');
  const bookItemBtn = document.getElementById('book-item-btn');

  // Focus Management
  let activeElementBeforeModal = null;
  let modalFocusables = [];
  let firstModalFocusable = null;
  let lastModalFocusable = null;
  let currentUserEmail = "";
  let map = null;

  // Date Formatting
  const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: '2-digit', 
          year: 'numeric' 
      }).replace(',', '');
  };

  // Modal Focus Management
  const getModalFocusables = () => {
      return modal.querySelectorAll(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
  };

  const trapModalFocus = (e) => {
      if (e.key === 'Tab') {
          if (e.shiftKey) {
              if (document.activeElement === firstModalFocusable) {
                  e.preventDefault();
                  lastModalFocusable.focus();
              }
          } else {
              if (document.activeElement === lastModalFocusable) {
                  e.preventDefault();
                  firstModalFocusable.focus();
              }
          }
      }
  };

  const handleEscKey = (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
          closeModal();
      }
  };

  const openModal = () => {
      activeElementBeforeModal = document.activeElement;
      modalFocusables = getModalFocusables();
      firstModalFocusable = modalFocusables[0];
      lastModalFocusable = modalFocusables[modalFocusables.length - 1];

      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      firstModalFocusable.focus();
      
      modal.addEventListener('keydown', trapModalFocus);
      document.addEventListener('keydown', handleEscKey);
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.removeEventListener('keydown', trapModalFocus);
    document.removeEventListener('keydown', handleEscKey);

    if (map) {
        map.remove();
        map = null;
    }

    // Focus restoration
    if (activeElementBeforeModal && document.body.contains(activeElementBeforeModal)) {
        activeElementBeforeModal.focus();
    } else {
        // Fallback: focus next item card's "View Details" button
        const allCards = Array.from(document.querySelectorAll('.view-btn-card'));
        const currentIndex = allCards.findIndex(btn => btn === activeElementBeforeModal);
        if (currentIndex >= 0 && currentIndex + 1 < allCards.length) {
            allCards[currentIndex + 1].focus();
        } else {
            // Fallback to first card
            allCards[0]?.focus();
        }
    }
};


  // Modal Event Handlers
  document.querySelector('.items-grid').addEventListener('click', (e) => {
      if (!e.target.classList.contains('view-btn-card')) return;
      const card = e.target.closest('.item-card');
      if (!card) return;

      // Reset modal state
      if (map) map.remove();
      mapElement.innerHTML = '';
      messageBox.value = '';

      // Set content from dataset
      const dataset = card.dataset;
      modalTitle.textContent = dataset.title;
      modalImage.src = dataset.image ? `http://localhost:3000/${dataset.image}` : '';
      modalDescription.textContent = dataset.description;
      modalCategory.textContent = dataset.category;
      modalPickup.textContent = dataset.pickup;
      modalDate.textContent = formatDate(dataset.date);
      document.getElementById('modal-available').textContent = 
          dataset.available === 'true' ? 'Yes' : 'No';

      // Toggle form visibility
      const isAvailable = dataset.available === 'true';
      bookForm.style.display = isAvailable ? 'block' : 'none';
      unavailableBtn.style.display = isAvailable ? 'none' : 'block';
      bookForm.action = `/book/${dataset.id}`;

      // Load map
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dataset.pickup)}`)
          .then(response => response.json())
          .then(data => {
              if (data.length > 0) {
                  const lat = parseFloat(data[0].lat);
                  const lon = parseFloat(data[0].lon);
                  map = L.map('map').setView([lat, lon], 15);
                  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                  L.marker([lat, lon]).addTo(map);
              } else {
                  mapElement.innerHTML = 'Location not found';
              }
          })
          .catch(console.error);

      openModal();
  });

  closeBtn.addEventListener('click', closeModal);
  window.addEventListener('click', (e) => e.target === modal && closeModal());

  sendBtn.addEventListener('click', () => {
      const message = messageBox.value.trim();
      if (!message) return alert("Please enter a message before sending.");
      console.log(`Message to ${currentUserEmail}: ${message}`);
      alert("Message sent!");
      closeModal();
  });

  // Search Functionality
  searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      document.querySelectorAll('.item-card').forEach(card => {
          const title = card.dataset.title.toLowerCase();
          const category = card.dataset.category.toLowerCase();
          const pickup = card.dataset.pickup.toLowerCase();
          card.style.display = (title.includes(query) || 
                              category.includes(query) || 
                              pickup.includes(query)) 
                              ? 'block' : 'none';
      });
  });

  // Dropdown Navigation
  const dropdownBtn = document.getElementById('dropdown-my-activity');
  const dropdownMenu = document.getElementById('my-activity-dropdown');
  let dropdownLinks = [];

  const toggleDropdown = (open) => {
      const isOpen = open ?? (dropdownBtn.getAttribute('aria-expanded') === 'false');
      dropdownBtn.setAttribute('aria-expanded', isOpen);
      dropdownMenu.hidden = !isOpen;

      if (isOpen) {
          dropdownLinks = Array.from(dropdownMenu.querySelectorAll('[role="menuitem"]'));
          dropdownMenu.setAttribute('aria-hidden', 'false');
          dropdownLinks.forEach(link => {
              link.tabIndex = -1;
              link.setAttribute('aria-hidden', 'false');
          });
          dropdownLinks[0]?.focus();
      } else {
          dropdownMenu.setAttribute('aria-hidden', 'true');
      }
  };

  dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
  });

  dropdownBtn.addEventListener('keydown', (e) => {
      if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
          e.preventDefault();
          toggleDropdown(true);
      }
  });

  dropdownMenu.addEventListener('keydown', (e) => {
      const currentIndex = dropdownLinks.indexOf(document.activeElement);
      
      switch(e.key) {
          case 'ArrowDown':
              e.preventDefault();
              const nextIndex = (currentIndex + 1) % dropdownLinks.length;
              dropdownLinks[nextIndex].focus();
              break;
          case 'ArrowUp':
              e.preventDefault();
              const prevIndex = (currentIndex - 1 + dropdownLinks.length) % dropdownLinks.length;
              dropdownLinks[prevIndex].focus();
              break;
          case 'Escape':
              toggleDropdown(false);
              dropdownBtn.focus();
              break;
          case 'Home':
              e.preventDefault();
              dropdownLinks[0]?.focus();
              break;
          case 'End':
              e.preventDefault();
              dropdownLinks[dropdownLinks.length - 1]?.focus();
              break;
      }
  });

  document.addEventListener('click', (e) => {
      if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
          toggleDropdown(false);
      }
  });

  // Close dropdown if focus leaves the button and menu (e.g., using Tab)
document.addEventListener('focusin', (e) => {
  if (
      dropdownMenu.hidden === false &&
      !dropdownBtn.contains(e.target) &&
      !dropdownMenu.contains(e.target)
  ) {
      toggleDropdown(false);
  }
});

  // Initialize dropdowns
  document.querySelectorAll('.dropdown-content').forEach(menu => {
      menu.hidden = true;
      menu.setAttribute('aria-hidden', 'true');
  });
  document.querySelectorAll('[aria-haspopup="true"]').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
  });
});