/* Progressive enhancement: native selects remain the source of truth. */
(() => {
  'use strict';
  let openControl = null;
  document.querySelectorAll('.rubric-controls select, #sample-capability').forEach((select) => {
    const label = select.getAttribute('aria-label') || [...select.labels].map((item) => item.textContent.trim()).join(' ');
    const wrapper = document.createElement('span');
    wrapper.className = 'custom-select';
    select.before(wrapper);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'select-trigger';
    button.id = `${select.id}-trigger`;
    button.setAttribute('role', 'combobox');
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `${select.id}-listbox`);
    const caption = document.createElement('span');
    caption.className = 'select-caption';
    const detail = document.createElement('span');
    detail.className = 'select-detail';
    detail.setAttribute('aria-hidden', 'true');
    const chevron = document.createElement('span');
    chevron.className = 'select-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    button.append(caption, detail, chevron);
    const list = document.createElement('ul');
    list.className = 'select-listbox';
    list.id = `${select.id}-listbox`;
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', label);
    list.hidden = true;
    let active = select.selectedIndex;
    let prefix = '';
    let prefixTimer;
    const options = [...select.options].map((option, index) => {
      const row = document.createElement('li');
      row.id = `${select.id}-option-${index}`;
      row.className = 'select-option';
      row.setAttribute('role', 'option');
      row.dataset.value = option.value;
      const text = document.createElement('span'); text.textContent = option.textContent;
      const weight = document.createElement('span'); weight.className = 'option-detail'; weight.textContent = option.dataset.detail || '';
      const check = document.createElement('span'); check.className = 'option-check'; check.textContent = '✓'; check.setAttribute('aria-hidden', 'true');
      row.append(text, weight, check);
      row.addEventListener('pointermove', () => highlight(index, false));
      row.addEventListener('click', () => choose(index));
      list.append(row);
      return row;
    });
    function sync() {
      const selected = select.options[select.selectedIndex];
      caption.textContent = selected.textContent;
      detail.textContent = selected.dataset.detail || '';
      button.setAttribute('aria-label', `${label}: ${selected.textContent}`);
      options.forEach((option, index) => option.setAttribute('aria-selected', String(index === select.selectedIndex)));
    }
    function highlight(index, scroll = true) {
      active = Math.max(0, Math.min(index, options.length - 1));
      options.forEach((option, i) => option.classList.toggle('is-active', i === active));
      button.setAttribute('aria-activedescendant', options[active].id);
      if (scroll) {
        const row = options[active];
        const top = row.offsetTop;
        const bottom = top + row.offsetHeight;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
      }
    }
    function close(focus = false) {
      list.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      button.removeAttribute('aria-activedescendant');
      wrapper.classList.remove('is-open');
      if (openControl?.close === close) openControl = null;
      prefix = '';
      if (focus) button.focus({ preventScroll: true });
    }
    function open() {
      openControl?.close();
      list.hidden = false;
      const rect = button.getBoundingClientRect();
      const needed = Math.min(list.scrollHeight, 272) + 12;
      wrapper.dataset.placement = innerHeight - rect.bottom < needed && rect.top > innerHeight - rect.bottom ? 'up' : 'down';
      wrapper.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
      openControl = { wrapper, close };
      highlight(select.selectedIndex);
    }
    function choose(index) {
      const changed = select.selectedIndex !== index;
      select.selectedIndex = index;
      sync(); close(true);
      if (changed) select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    button.addEventListener('click', (event) => {
      event.preventDefault();
      list.hidden ? open() : close();
    });
    button.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const wasClosed = list.hidden;
        if (wasClosed) open();
        if (event.key === 'Home' || event.key === 'End') highlight(event.key === 'Home' ? 0 : options.length - 1);
        else if (!wasClosed) highlight(active + (event.key === 'ArrowDown' ? 1 : -1));
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); list.hidden ? open() : choose(active);
      } else if (event.key === 'Escape' && !list.hidden) {
        event.preventDefault(); close(true);
      } else if (event.key === 'Tab') close();
      else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (list.hidden) open();
        clearTimeout(prefixTimer); prefix += event.key.toLowerCase();
        const match = [...select.options].findIndex((option) => option.textContent.toLowerCase().startsWith(prefix));
        if (match >= 0) highlight(match);
        prefixTimer = setTimeout(() => { prefix = ''; }, 650);
      }
    });
    select.addEventListener('change', sync);
    [...select.labels].forEach((item) => { item.htmlFor = button.id; });
    select.hidden = true; select.tabIndex = -1;
    wrapper.append(select, button, list);
    sync();
  });
  document.addEventListener('pointerdown', (event) => {
    if (openControl && !openControl.wrapper.contains(event.target)) openControl.close();
  });
  document.addEventListener('focusin', (event) => {
    if (openControl && !openControl.wrapper.contains(event.target)) openControl.close();
  });
  window.addEventListener('resize', () => openControl?.close(), { passive: true });
})();
