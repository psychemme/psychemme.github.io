(() => {
  'use strict';

  const resources = window.PSYCHEMME_RESOURCES || {};
  document.querySelectorAll('[data-resource]').forEach((element) => {
    const url = resources[element.dataset.resource];
    if (!url) return;
    let link = element;
    if (element.tagName !== 'A') {
      link = document.createElement('a');
      link.className = element.className;
      link.dataset.resource = element.dataset.resource;
      link.innerHTML = element.innerHTML;
      link.querySelector('small')?.remove();
      element.replaceWith(link);
    }
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    const status = link.querySelector('.resource-status');
    if (status) status.textContent = 'Open resource ↗';
  });
  const missingCount = ['code', 'dataset', 'models', 'logs'].filter((key) => !resources[key]).length;
  if (missingCount === 0) {
    document.querySelector('.availability-note').textContent = 'This partial release includes selected core code, 78 text questions, source locators for all 630 episodes, two paper LoRA adapters, and complete main-table numeric results. Videos remain at their original sources.';
  }

  const nav = document.querySelector('.nav-links');
  const navLinks = [...nav.querySelectorAll('a')];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href')));
  let scrollQueued = false;
  function updateNavigation() {
    const marker = window.scrollY + 160;
    let active = null;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top + window.scrollY <= marker) active = index;
    });
    navLinks.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateNavigation);
    }
  }, { passive: true });
  window.addEventListener('resize', updateNavigation);
  document.querySelectorAll('details').forEach((details) => details.addEventListener('toggle', updateNavigation));
  updateNavigation();

  const filters = [...document.querySelectorAll('[data-filter]')];
  const rows = [...document.querySelectorAll('.main-table tbody tr')];
  const groupNames = {
    frozen: '17 frozen models',
    proprietary: '8 proprietary frozen models',
    open: '9 open-weight frozen models',
    adapted: '2 adapted checkpoints, separate from the 17 frozen models'
  };
  filters.forEach((button) => button.addEventListener('click', () => {
    const selected = button.dataset.filter;
    filters.forEach((filter) => filter.setAttribute('aria-pressed', String(filter === button)));
    rows.forEach((row) => {
      row.hidden = selected === 'frozen' ? row.dataset.group === 'adapted' : row.dataset.group !== selected;
    });
    document.querySelector('#results-caption').textContent = `${groupNames[selected]}. Overall scores are macro means; capability columns are Reasoning-Verified scores (%).`;
  }));

  const lightbox = document.querySelector('.lightbox');
  const enlargedImage = lightbox.querySelector('img');
  const closeButton = lightbox.querySelector('.lightbox-close');
  let previousFocus = null;
  function closeLightbox() { lightbox.close(); }
  document.querySelectorAll('[data-lightbox]').forEach((link) => link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || typeof lightbox.showModal !== 'function') return;
    event.preventDefault();
    previousFocus = link;
    enlargedImage.classList.remove('full-resolution');
    enlargedImage.setAttribute('aria-pressed', 'false');
    enlargedImage.setAttribute('aria-label', 'View figure at full resolution');
    enlargedImage.src = link.href;
    enlargedImage.alt = link.querySelector('img').alt;
    lightbox.querySelector('.lightbox-title').textContent = link.dataset.title;
    lightbox.querySelector('.lightbox-vector').href = link.dataset.vector;
    lightbox.querySelector('.lightbox-vector').textContent = link.dataset.vectorLabel || 'Vector PDF ↗';
    lightbox.showModal();
    lightbox.querySelector('.lightbox-body').scrollTo(0, 0);
    document.body.classList.add('modal-open');
    closeButton.focus();
  }));
  closeButton.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
  lightbox.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    previousFocus?.focus({ preventScroll: true });
  });
  function toggleResolution() {
    const full = enlargedImage.classList.toggle('full-resolution');
    enlargedImage.setAttribute('aria-label', full ? 'Fit figure to window' : 'View figure at full resolution');
    enlargedImage.setAttribute('aria-pressed', String(full));
  }
  enlargedImage.tabIndex = 0;
  enlargedImage.setAttribute('role', 'button');
  enlargedImage.setAttribute('aria-label', 'View figure at full resolution');
  enlargedImage.setAttribute('aria-pressed', 'false');
  enlargedImage.addEventListener('click', toggleResolution);
  enlargedImage.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleResolution();
    }
  });
})();
