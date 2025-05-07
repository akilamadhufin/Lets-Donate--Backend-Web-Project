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
  
    function formatDate(dateString) {
      const date = new Date(dateString);
      const options = { month: 'short', day: '2-digit', year: 'numeric' };
      return date.toLocaleDateString('en-US', options).replace(',', '');
    }

  // to open each modal when click on each item card
  document.querySelector('.items-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.item-card');
    if (!card) return;

    // Reseting the modal state
    if (map) {
      map.remove();
      map = null;
    }
    mapElement.innerHTML = '';
    messageBox.value = '';


});