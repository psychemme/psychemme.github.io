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
  // Display-only glosses; the released records keep their original labels.
  const strategyLabels = {
    PREVENTIVE_INTERVENTION: 'Take preventive action',
    INTERVENE_NOW: 'Intervene now',
    OFFER_DIRECTLY: 'Offer help directly',
    DEESCALATE: 'De-escalate the situation',
    REFER_TO_OTHER: 'Refer to someone else',
    WAIT_AND_OBSERVE: 'Wait and observe',
    NO_INTERVENTION: 'Do not intervene',
    ASK_FIRST: 'Ask before intervening',
    CORRECTIVE_INTERVENTION: 'Take corrective action',
    IGNORE_HESITATION: 'Ignore the hesitation',
    VALIDATE: 'Validate',
    APOLOGIZE: 'Apologize',
    DECLINE: 'Decline',
    REDIRECT: 'Redirect the conversation',
    ENCOURAGE: 'Encourage the person',
    OFFER_HELP: 'Offer help',
    SET_BOUNDARY: 'Set a boundary',
    ASK_CLARIFICATION: 'Ask a clarifying question',
    ACKNOWLEDGE: 'Acknowledge what was said',
    COMFORT: 'Offer comfort',
    IGNORE: 'Ignore'
  };
  const readable = (text) => strategyLabels[text] || text;
  fetch('assets/released-examples.json').then((response) => {
    if (!response.ok) throw new Error('Example download failed');
    return response.json();
  }).then((data) => {
    function render() {
      const sample = data.examples.find((entry) => entry.input.category === choice.value);
      const input = sample.input, reference = sample.reference;
      const taskName = input.task_type.replaceAll('_', ' ');
      document.getElementById('sample-meta').textContent = `${taskName[0].toUpperCase() + taskName.slice(1)} · ${input.source_dataset}`;
      const article = node('article', 'sample-reading');
      article.append(node('h4', 'sample-question', input.question));
      if (input.memory_context) {
        const memory = node('div', 'sample-memory');
        memory.append(node('strong', '', 'Context supplied with the question'), node('p', '', input.memory_context));
        article.append(memory);
      }
      if (input.options.length) {
        const options = node('ol', 'sample-options'); options.type = 'A';
        if (input.options.every((option) => readable(option).length < 65)) options.classList.add('sample-options-compact');
        input.options.forEach((option) => options.append(node('li', '', readable(option))));
        article.append(options);
        if (input.options.some((option) => strategyLabels[option])) article.append(node('p', 'sample-label-note', 'Strategy labels are expanded for readability. Original wording is available below.'));
      } else article.append(node('p', 'sample-context', 'Open answer · respond in natural language.'));
      const details = node('details', 'sample-reference');
      details.append(node('summary', '', 'Show reference answer'));
      if ((reference.answer_indices || []).length) {
        reference.answer_indices.forEach((index) => {
          const original = input.options[index];
          const answer = node('p', 'sample-answer', `${String.fromCharCode(65 + index)}. ${readable(original)}`);
          if (strategyLabels[original]) answer.append(document.createTextNode(' '), node('code', '', original));
          details.append(answer);
        });
      } else details.append(node('p', 'sample-answer', reference.reference_answer || 'No reference text recorded.'));
      article.append(details);
      const raw = node('details', 'sample-record');
      raw.append(node('summary', '', 'Original wording and record'), node('h4', '', 'Model input'), node('p', 'sample-context', 'Original option labels and model-facing fields, without reference answers.'), node('pre', '', JSON.stringify(input, null, 2)));
      const review = sample.review_status;
      if (review) {
        const reviewDetails = node('details', 'sample-review');
        reviewDetails.append(node('summary', '', 'Published review metadata'), node('pre', '', JSON.stringify(review, null, 2)));
        raw.append(reviewDetails);
      }
      article.append(raw, node('p', 'sample-origin', `Text preview · ${input.question_id} · ${input.source_dataset} · episode ${input.episode_id}`));
      content.replaceChildren(article);
    }
    choice.addEventListener('change', render); render();
  }).catch(() => {
    const message = node('p', 'sample-loading', 'Text preview is unavailable. ');
    const link = node('a', '', 'Release updates ↗');
    link.href = 'https://huggingface.co/datasets/psychemme/PsycheMME';
    link.target = '_blank'; link.rel = 'noopener';
    message.append(link); content.replaceChildren(message);
  });
})();
