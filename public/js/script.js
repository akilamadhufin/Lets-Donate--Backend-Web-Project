document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.item-card');
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
    
    let currentUserEmail = "";
    let map = null;
  
    // to convert long date to short date
    function formatDate(dateString) {
      const date = new Date(dateString);
      const options = { month: 'short', day: '2-digit', year: 'numeric' };
      return date.toLocaleDateString('en-US', options).replace(',', '');
    }

  // to open each modal when click on each item card
  document.querySelector('.items-grid').addEventListener('click', (e) => {
    if (!e.target.classList.contains('view-btn-card')) return;
    const card = e.target.closest('.item-card');
    if (!card) return;

    // Reseting the modal state
    if (map) {
      map.remove();
      map = null;
    }
    mapElement.innerHTML = '';
    messageBox.value = '';

    // Set modal content
    const dataset = card.dataset;
    modalTitle.textContent = dataset.title;
    modalImage.src = dataset.image ? `http://localhost:3000/${dataset.image}` : '';
    modalDescription.textContent = dataset.description;
    modalCategory.textContent = dataset.category;
    modalPickup.textContent = dataset.pickup;
    modalDate.textContent = formatDate(dataset.date);
    document.getElementById('modal-available').textContent = dataset.available === 'true' ? 'Yes' : 'No';
    currentUserEmail = dataset.user;


    // adding map feature
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dataset.pickup)}`)
      .then(response => response.json())
      .then(data => {
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          
          map = L.map('map').setView([lat, lon], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          L.marker([lat, lon]).addTo(map);
        } else {
          mapElement.innerHTML = 'Location not found';
        }
      })
      .catch(error => {
        console.error('Geocoding error:', error);
        mapElement.innerHTML = 'Error loading map';
      });

    modal.classList.remove('hidden');
  });

    // Close modal
    function closeModal() {
        modal.classList.add('hidden');
        messageBox.value = "";
        if (map) {
          map.remove();
          map = null;
        }
      }

      // close button in the modal view
      closeBtn.addEventListener('click', closeModal);
      window.addEventListener('click', (e) => e.target === modal && closeModal());
    
      sendBtn.addEventListener('click', () => {
        const message = messageBox.value.trim();
        if (!message) return alert("Please enter a message before sending.");
        
        console.log(`Message to ${currentUserEmail}: ${message}`);
        alert("Message sent!");
        closeModal();
      });
    

// search bar to the index.hbs page
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    document.querySelectorAll('.item-card').forEach(card => {
      const title = card.dataset.title.toLowerCase();
      const category = card.dataset.category.toLowerCase();
      const pickup = card.dataset.pickup.toLowerCase();
  
      const matches = title.includes(query) || category.includes(query) || pickup.includes(query);
      card.style.display = matches ? 'block' : 'none';
    });
  });
  });