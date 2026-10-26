/* Progressive enhancements: every feature here is optional and the page works without it. */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reading progress along the top edge. */
  const progress = document.createElement('div');
  progress.className = 'read-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  let progressQueued = false;
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    progressQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!progressQueued) { progressQueued = true; window.requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  /* Complete results table: score shading and sortable columns. */
  const table = document.querySelector('.main-table');
  if (table) {
    const body = table.tBodies[0];
    const rows = [...body.rows];
    rows.forEach((row) => [...row.cells].slice(3).forEach((cell) => {
      const value = parseFloat(cell.textContent);
      cell.style.setProperty('--heat', (Math.max(0, value - 10) / 85 * 0.32).toFixed(3));
      cell.classList.add('heat');
    }));

    const headers = [table.tHead.rows[0].cells[0], ...table.tHead.rows[1].cells];
    let current = null;
    headers.forEach((header, column) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sort-button';
      button.append(...header.childNodes);
      header.append(button);
      button.addEventListener('click', () => {
        const descending = !(current === column && header.getAttribute('aria-sort') === 'descending');
        const key = (row) => column === 0 ? row.cells[0].textContent.trim() : parseFloat(row.cells[column].textContent);
        rows.sort((a, b) => {
          const order = column === 0 ? key(a).localeCompare(key(b)) : key(a) - key(b);
          return descending ? -order : order;
        });
        body.append(...rows);
        headers.forEach((cell) => cell.removeAttribute('aria-sort'));
        header.setAttribute('aria-sort', descending ? 'descending' : 'ascending');
        current = column;
      });
    });
    const hint = table.closest('.table-shell')?.querySelector('.table-toolbar');
    if (hint) hint.insertAdjacentHTML('beforeend', '<span class="sort-hint">Select a column heading to sort</span>');
  }

  /* Bars grow in the first time they scroll into view. */
  const animated = document.querySelectorAll('.memory-chart, .summary-table');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    animated.forEach((item) => item.classList.add('will-reveal'));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    }), { threshold: 0.35 });
    animated.forEach((item) => observer.observe(item));
  }

  /* Selected comparisons: a thin bar behind each Verified score. */
  document.querySelectorAll('.summary-table tbody tr').forEach((row) => {
    const cell = row.cells[row.cells.length - 1];
    cell.classList.add('score-bar');
    cell.style.setProperty('--score', parseFloat(cell.textContent));
  });

  /* Rubric outputs count to their new value instead of jumping. */
  const outputs = ['rubric-raw', 'rubric-verified'].map((id) => document.getElementById(id)).filter(Boolean);
  outputs.forEach((output) => {
    let shown = parseFloat(output.textContent);
    let frame = null;
    let written = null;
    new MutationObserver(() => {
      // Our own frames also trigger the observer; only react to values set elsewhere.
      if (output.textContent === written) return;
      const target = parseFloat(output.textContent);
      if (reduceMotion || Number.isNaN(shown) || Number.isNaN(target) || target === shown) { shown = target; return; }
      const start = shown, began = performance.now();
      cancelAnimationFrame(frame);
      const step = (now) => {
        const t = Math.min(1, (now - began) / 380);
        shown = t < 1 ? start + (target - start) * (1 - Math.pow(1 - t, 3)) : target;
        written = `${shown.toFixed(2)}%`;
        output.textContent = written;
        if (t < 1) frame = requestAnimationFrame(step);
      };
      written = `${start.toFixed(2)}%`;
      output.textContent = written;
      frame = requestAnimationFrame(step);
    }).observe(output, { childList: true, characterData: true, subtree: true });
  });

  /* Capability list links to an example question for that capability. */
  const sampleSelect = document.getElementById('sample-capability');
  const examples = document.getElementById('examples');
  if (sampleSelect && examples) {
    document.querySelectorAll('.taxonomy .capability').forEach((item) => {
      const code = item.querySelector('b')?.textContent.trim();
      if (![...sampleSelect.options].some((option) => option.value === code)) return;
      const name = item.childNodes[1]?.textContent.trim() || code;
      item.tabIndex = 0;
      item.setAttribute('role', 'link');
      item.setAttribute('aria-label', `${name}: read an example question`);
      item.classList.add('is-linked');
      const open = () => {
        sampleSelect.value = code;
        sampleSelect.dispatchEvent(new Event('change', { bubbles: true }));
        examples.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      };
      item.addEventListener('click', open);
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
      });
    });
    document.querySelector('.taxonomy')?.insertAdjacentHTML('afterend', '<p class="taxonomy-hint">Select a capability to read an example question.</p>');
  }
})();
