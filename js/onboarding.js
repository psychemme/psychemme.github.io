(() => {
  'use strict';
  const tabs = [...document.querySelectorAll('.start-tabs [role="tab"]')];
  function activate(tab) {
    tabs.forEach((candidate) => {
      const active = candidate === tab;
      candidate.setAttribute('aria-selected', String(active));
      candidate.tabIndex = active ? 0 : -1;
      document.getElementById(candidate.getAttribute('aria-controls')).hidden = !active;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault(); activate(tabs[next]); tabs[next].focus();
      }
    });
  });
  activate(tabs[0]);
  document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
    const block = document.getElementById(button.dataset.copy);
    try {
      await navigator.clipboard.writeText(block.textContent);
      document.getElementById('copy-status').textContent = 'Commands copied to clipboard.';
      button.textContent = 'Copied ✓';
      setTimeout(() => { button.textContent = 'Copy commands'; }, 2000);
    } catch {
      const range = document.createRange(); range.selectNodeContents(block);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      block.focus();
      document.getElementById('copy-status').textContent = 'Commands selected. Use your keyboard to copy.';
    }
  }));

  const rubric = ['answer', 'support', 'logic'].map((name) => document.getElementById(`rubric-${name}`));
  function calculate() {
    const [answer, support, logic] = rubric.map((control) => Number(control.value));
    const verified = answer * support * logic / 1.44;
    document.getElementById('rubric-raw').textContent = `${(answer * 100).toFixed(2)}%`;
    document.getElementById('rubric-verified').textContent = `${(verified * 100).toFixed(2)}%`;
    document.getElementById('rubric-formula').textContent = `${answer} × ${support} × ${logic} ÷ 1.44 = ${verified.toFixed(4)}`;
  }
  rubric.forEach((control) => control.addEventListener('change', calculate));
  calculate();

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  const content = document.getElementById('sample-content');
  const choice = document.getElementById('sample-capability');
  fetch('assets/released-examples.json').then((response) => {
    if (!response.ok) throw new Error('Example download failed');
    return response.json();
  }).then((data) => {
    function render() {
      const sample = data.examples.find((entry) => entry.input.category === choice.value);
      const input = sample.input, reference = sample.reference;
      document.getElementById('sample-meta').textContent = `${input.question_id} · ${input.source_dataset} · ${input.task_type.replaceAll('_', ' ')}`;
      const grid = node('div', 'sample-grid');
      const publicPanel = node('article', 'sample-card');
      publicPanel.append(node('p', 'mini-label', 'Model-facing question'), node('h3', '', input.question));
      if (input.options.length) {
        const options = node('ol', 'sample-options'); options.type = 'A';
        input.options.forEach((option) => options.append(node('li', '', option)));
        publicPanel.append(options);
      } else publicPanel.append(node('p', 'sample-context', 'Open answer · respond in natural language.'));
      if (input.memory_context) publicPanel.append(node('p', 'sample-context', `Public memory: ${input.memory_context}`));
      publicPanel.append(node('p', 'sample-context', `Episode ${input.episode_id}. Text preview only; original video and ASR are required for actual evaluation.`));
      const raw = node('details', 'sample-json');
      raw.append(node('summary', '', 'Inspect the model-input JSON'), node('pre', '', JSON.stringify(input, null, 2)));
      publicPanel.append(raw);
      const evaluator = node('aside', 'sample-card evaluator-card');
      evaluator.append(node('p', 'mini-label', 'Evaluator only'), node('h3', '', 'Reference answer and evidence'), node('p', 'sample-context', 'These fields are public for inspection but must never be included in the tested model’s input.'));
      const details = node('details', 'sample-reference');
      details.append(node('summary', '', 'Reveal the reference'));
      const answer = (reference.answer_indices || []).length
        ? reference.answer_indices.map((index) => `${String.fromCharCode(65 + index)}. ${input.options[index]}`).join('; ')
        : reference.reference_answer || 'No reference text recorded.';
      details.append(node('p', 'sample-answer', answer));
      const evidence = node('ul', 'sample-evidence');
      const entries = Array.isArray(reference.evidence) ? reference.evidence : [{ content: reference.evidence }];
      entries.forEach((entry) => {
        const text = typeof entry === 'string' ? entry : entry.content || JSON.stringify(entry);
        const interval = Array.isArray(entry.time) ? `[${entry.time.join('–')}s] ` : '';
        evidence.append(node('li', '', interval + text));
      });
      details.append(evidence); evaluator.append(details);
      const review = sample.review_status;
      if (review) {
        const reviewDetails = node('details', 'sample-json');
        reviewDetails.append(node('summary', '', 'Published review status'), node('pre', '', JSON.stringify(review, null, 2)));
        evaluator.append(reviewDetails);
      }
      grid.append(publicPanel, evaluator); content.replaceChildren(grid);
    }
    choice.addEventListener('change', render); render();
  }).catch(() => {
    content.querySelector('.sample-loading').firstChild.textContent = 'Text preview is unavailable. ';
  });
})();
