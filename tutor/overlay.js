/* The reader's side of the tutor: a chat panel that floats over the page. Text selected on the
   page goes with the next message as its context. The reader's own changes to the page (a reply
   pinned under a passage, a rewording, a passage hidden) are laid over it and marked in the left
   margin. tutor/server.py adds this script to every page it serves.

   On the published site there is no tutor. tutor/web.py adds the script with data-mode="web",
   and it then does one thing: the reader can write notes of their own on a passage, and they are
   kept in the browser. */
(() => {
  const page = document.currentScript.dataset.page;
  const web = document.currentScript.dataset.mode === 'web';
  const QUICK = {
    Simpler: 'Can you say this more simply?',
    'An example': 'Can you give me an example of this?',
    'Why?': 'Why is this so?',
  };
  // a pinned note may follow one of these...
  const BLOCK = 'p, li, h1, h2, h3, blockquote, figcaption';
  // ...unless it sits in a layout that an extra box would break; then it goes to the section's end
  const FRAGILE = '.scrolly, .pop, .card, .leaf, .cards3, .row, .bar, svg, button, figure, nav, table';
  const OURS = '.tutor-note, .tutor-shelf, .tutor-ask, .tutor-panel, .tutor-chip, .tutor-line, .tutor-gone, .tutor-diff';

  const norm = s => s.replace(/\s+/g, ' ').trim();
  const clip = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  };
  // what a range holds, without any of our own boxes that sit inside it
  const textIn = range => {
    const copy = range.cloneContents();
    copy.querySelectorAll(OURS + ', script, style').forEach(e => e.remove());
    return norm(copy.textContent);
  };
  const elementOf = node => (node.nodeType === 1 ? node : node.parentElement);
  const post = (path, body) => (web ? keepHere(path, body) : fetch('/tutor/api/' + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page, ...body }),
  }));
  const remembered = {
    get open() { try { return localStorage.getItem('tutor-open') === '1'; } catch { return false; } },
    set open(v) { try { localStorage.setItem('tutor-open', v ? '1' : '0'); } catch { /* private window */ } },
  };

  /* ---------- on the web: the reader's notes, kept in this browser ---------- */

  // With no server behind the page, a note lives in localStorage, in the shape the server gives
  // one. Each carries the time it last changed, and a removed note leaves its id and that time
  // behind, so that the notes of two devices can be merged without a removed one coming back.
  const KEY = 'daag-notes:' + page;  // the site shares its origin with others, so the name says whose
  let kept = [], asked = false;

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(raw)) kept = raw;
    } catch { /* nothing stored, or no storage: keep what this page has */ }
    return kept.filter(n => !n.deleted);
  }

  function keep(note) {
    load();
    kept = kept.filter(n => n.id !== note.id).concat(note).sort((a, b) => (a.id < b.id ? -1 : 1));
    try {
      localStorage.setItem(KEY, JSON.stringify(kept));
      KIND.own = 'Your own note';
      // ask the browser not to clear the notes when it runs short of room
      if (!asked && navigator.storage && navigator.storage.persist) { asked = true; navigator.storage.persist().catch(() => {}); }
    } catch { KIND.own = 'Your own note · not saved: this browser is not keeping data'; }
    renderNotes(kept.filter(n => !n.deleted));
  }

  function keepHere(path, body) {
    const now = new Date(), two = n => String(n).padStart(2, '0');
    const old = kept.find(n => n.id === body.id);
    // never earlier than the change before it, whatever the clock says
    const updated = new Date(Math.max(now, old ? Date.parse(old.updated) + 1 || 0 : 0)).toISOString();
    if (path === 'drop') return keep({ id: body.id, updated, deleted: true });
    const day = [now.getFullYear(), two(now.getMonth() + 1), two(now.getDate())];
    const time = [two(now.getHours()), two(now.getMinutes()), two(now.getSeconds())];
    const escaped = s => s.replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
    keep({
      id: body.id || day.join('') + '-' + time.join('') + '-' + crypto.getRandomValues(new Uint16Array(1))[0].toString(16).padStart(4, '0'),
      page, section: body.section || '', kind: 'own',
      asked: old ? old.asked : day.join('-') + ' ' + time.slice(0, 2).join(':'),
      updated, quote: body.quote, prefix: body.prefix || '', suffix: body.suffix || '',
      html: body.text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
        .map(p => '<p>' + escaped(p).replace(/\n/g, '<br>') + '</p>').join('\n'),
    });
  }

  /* ---------- finding a quote in the page ---------- */

  // the section's text with whitespace collapsed, and where each character of it lives
  function textOf(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.parentElement.closest(OURS + ', script, style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    let text = '', gap = true;
    const at = [];
    for (let n; (n = walker.nextNode());) {
      const s = n.nodeValue;
      for (let i = 0; i < s.length; i++) {
        if (/\s/.test(s[i])) {
          if (gap) continue;
          gap = true; text += ' ';
        } else { gap = false; text += s[i]; }
        at.push([n, i]);
      }
    }
    return { text, at };
  }

  function locate(root, note) {
    const { text, at } = textOf(root);
    let best = -1, bestScore = -1;
    for (let i = text.indexOf(note.quote); i >= 0; i = text.indexOf(note.quote, i + 1)) {
      const before = norm(text.slice(Math.max(0, i - 80), i));
      const after = norm(text.slice(i + note.quote.length, i + note.quote.length + 80));
      const score = (note.prefix && before.endsWith(note.prefix) ? 1 : 0) + (note.suffix && after.startsWith(note.suffix) ? 1 : 0);
      if (score > bestScore) { best = i; bestScore = score; }
    }
    if (best < 0) return null;
    const range = document.createRange();
    const [startNode, startOffset] = at[best];
    const [endNode, endOffset] = at[best + note.quote.length - 1];
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset + 1);
    return range;
  }

  /* ---------- the reader's changes to the page ---------- */

  // Each note is a change to the page as this reader sees it: a passage added (a pinned reply),
  // reworded or hidden. The page shows its latest text, in the page's own type, with a line in
  // the left margin as a diff does: green for added, yellow for changed, red for removed.
  // Clicking the line shows what changed. A note the reader wrote themselves has a blue line.
  const KIND = { aside: 'Added for you', reword: 'Changed for you', hide: 'Removed for you', own: 'Your own note' };

  function shelf(section) {
    let s = section.querySelector('.tutor-shelf');
    if (!s) {
      const wraps = section.querySelectorAll(':scope > .wrap');
      s = (wraps[wraps.length - 1] || section).appendChild(el('div', 'tutor-shelf'));
    }
    return s;
  }

  function undoButton(note) {
    const undo = el('button', 'tutor-undo', note.kind === 'own' ? 'Remove' : 'Undo this change');
    undo.onclick = e => {
      e.stopPropagation();
      if (!undo.dataset.sure) { undo.dataset.sure = 1; undo.textContent = note.kind === 'own' ? 'Really remove?' : 'Really undo?'; return; }
      post('drop', { id: note.id });
    };
    return undo;
  }

  // a change that cannot be made in place: its passage is gone, or sits where a layout would break
  function boxed(note, found) {
    const box = el('aside', 'tutor-note');
    box.appendChild(el('div', 'tutor-head', KIND[note.kind] || KIND.aside));
    box.appendChild(el('p', 'tutor-q', found ? 'This could not be shown in place.' : 'The passage this was written for has changed.'));
    box.appendChild(el('blockquote', 'tutor-on', clip(note.quote, 220)));
    if (note.question) box.appendChild(el('p', 'tutor-q', note.question));
    if (note.kind !== 'hide') box.appendChild(el('div', 'tutor-body')).innerHTML = note.html;
    box.appendChild(undoButton(note));
    return box;
  }

  // the words of a and of b, in order, each marked kept, removed or added
  function wordDiff(a, b) {
    const x = a.split(' ').filter(Boolean), y = b.split(' ').filter(Boolean);
    if (x.length * y.length > 400000) return [['del', a], ['ins', b]];
    const lcs = Array.from({ length: x.length + 1 }, () => new Uint16Array(y.length + 1));
    for (let i = x.length - 1; i >= 0; i--) {
      for (let j = y.length - 1; j >= 0; j--) {
        lcs[i][j] = x[i] === y[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
      }
    }
    const out = [];
    const push = (kind, word) => {
      const last = out[out.length - 1];
      if (last && last[0] === kind) last[1] += ' ' + word; else out.push([kind, word]);
    };
    let i = 0, j = 0;
    while (i < x.length || j < y.length) {
      if (i < x.length && j < y.length && x[i] === y[j]) { push('same', x[i]); i++; j++; }
      else if (i < x.length && (j === y.length || lcs[i + 1][j] >= lcs[i][j + 1])) push('del', x[i++]);
      else push('ins', y[j++]);
    }
    return out;
  }

  let diffBox = null;
  function closeDiff() { if (diffBox) diffBox.remove(); diffBox = null; }

  function showDiff(note, before, after, line) {
    const again = diffBox && diffBox.dataset.id === note.id;
    closeDiff();
    if (again) return;
    diffBox = el('div', 'tutor-diff');
    diffBox.dataset.id = note.id;
    diffBox.appendChild(el('div', 'tutor-head', KIND[note.kind]));
    if (note.question) diffBox.appendChild(el('p', 'tutor-q', note.question));
    if (note.kind === 'aside' || note.kind === 'own') diffBox.appendChild(el('blockquote', 'tutor-on', clip(note.quote, 220)));
    if (note.kind === 'own') {
      diffBox.appendChild(el('div', 'tutor-body')).innerHTML = note.html;
      const edit = diffBox.appendChild(el('button', 'tutor-undo', 'Edit'));
      edit.onclick = e => { e.stopPropagation(); writeNote(note, line, note); };
    } else {
      const body = diffBox.appendChild(el('p', 'tutor-words'));
      for (const [kind, words] of wordDiff(note.kind === 'aside' ? '' : before, after)) {
        body.appendChild(el(kind === 'same' ? 'span' : kind, '', words));
        body.append(' ');
      }
    }
    diffBox.appendChild(undoButton(note));
    putDiff(line.getBoundingClientRect());
  }

  function putDiff(rect) {
    document.body.appendChild(diffBox);
    // under the passage, so both can be read together
    diffBox.style.top = scrollY + rect.bottom + 8 + 'px';
    diffBox.style.left = scrollX + Math.max(8, Math.min(rect.left, innerWidth - diffBox.offsetWidth - 8)) + 'px';
  }

  // the reader writes, or rewrites, a note of their own about a passage
  function writeNote(anchor, near, existing) {
    const rect = near.getBoundingClientRect();
    closeDiff();
    diffBox = el('form', 'tutor-diff');
    diffBox.appendChild(el('div', 'tutor-head', KIND.own));
    diffBox.appendChild(el('blockquote', 'tutor-on', clip(anchor.quote, 220)));
    const text = diffBox.appendChild(el('textarea'));
    text.rows = 4;
    text.maxLength = 4000;
    text.placeholder = 'Write your note…';
    if (existing) {
      const made = el('div');
      made.innerHTML = existing.html.replace(/<br>/g, '\n');
      text.value = [...made.children].map(p => p.textContent).join('\n\n');
    }
    diffBox.appendChild(el('button', 'tutor-send', 'Save'));
    const cancel = diffBox.appendChild(el('button', 'tutor-undo', 'Cancel'));
    cancel.type = 'button';
    cancel.onclick = e => { e.stopPropagation(); closeDiff(); };
    diffBox.onsubmit = e => {
      e.preventDefault();
      if (!text.value.trim()) return;
      const { section, quote, prefix, suffix } = anchor;
      post('note', { section, quote, prefix, suffix, text: text.value, id: existing ? existing.id : '' });
      closeDiff();
      hideAsk();
      if (!existing) setDraft(null);  // the passage went to the note, not to the chat
      getSelection().removeAllRanges();
    };
    putDiff(rect);
    text.focus();
  }

  function place(note) {
    const section = (note.section && document.getElementById(note.section)) || document.body;
    const range = locate(section, note);
    // the paragraphs the quote runs through
    const covered = range ? [...section.querySelectorAll(BLOCK)].filter(b =>
      range.intersectsNode(b) && !b.closest(OURS) && !b.closest(FRAGILE) && !b.querySelector(BLOCK)) : [];
    if (!covered.length || elementOf(range.endContainer).closest(FRAGILE)) {
      shelf(section).appendChild(boxed(note, !!range));
      return;
    }
    const first = covered[0], last = covered[covered.length - 1];
    const before = covered.map(b => norm(b.textContent)).join(' ');
    let fresh;
    if (note.kind === 'hide') {
      fresh = [el('div', 'tutor-gone')];
      first.before(fresh[0]);
    } else {
      // set the new text in the type of the passage it belongs to
      // (a reader's own note keeps its own look, so it is never taken for the book's words)
      const model = note.kind === 'reword' ? first : note.kind !== 'own' && last.matches('p') ? last : null;
      const made = el('div');
      made.innerHTML = note.html;
      fresh = [...made.children].map(child => {
        if (!child.matches('p')) return child;
        const copy = model ? model.cloneNode(false) : el('p');
        copy.removeAttribute('id');
        copy.innerHTML = child.innerHTML;
        return copy;
      });
      if (note.kind === 'reword') first.before(...fresh);
      else {
        let after = last.matches('li') ? last.closest('ul, ol') : last;
        while (after.nextElementSibling && after.nextElementSibling.matches('.tutor-fresh')) after = after.nextElementSibling;
        after.after(...fresh);
      }
    }
    if (note.kind === 'reword' || note.kind === 'hide') covered.forEach(b => b.classList.add('tutor-hidden'));
    const after = note.kind === 'hide' ? '' : fresh.map(e => norm(e.textContent)).join(' ');
    for (const e of fresh) {
      e.classList.add('tutor-fresh', 'tutor-' + (KIND[note.kind] ? note.kind : 'aside'));
      const line = el('button', 'tutor-line');
      line.title = 'See what changed';
      line.onclick = ev => { ev.stopPropagation(); showDiff(note, before, after, line); };
      e.prepend(line);
    }
  }

  function renderNotes(notes) {
    if (diffBox && diffBox.tagName !== 'FORM') closeDiff();  // a note being written stays open
    document.querySelectorAll('.tutor-fresh, .tutor-note, .tutor-shelf').forEach(e => e.remove());
    document.querySelectorAll('.tutor-hidden').forEach(e => e.classList.remove('tutor-hidden'));
    // in the order they were made, so a change to an earlier change finds it
    for (const note of notes) place(note);
  }
  document.addEventListener('click', e => {
    if (diffBox && diffBox.tagName !== 'FORM' && !diffBox.contains(e.target)) closeDiff();
  });

  /* ---------- the chat panel ---------- */

  const chip = el('button', 'tutor-chip');
  const panel = el('div', 'tutor-panel');
  if (!web) document.body.append(chip, panel);
  const top = panel.appendChild(el('div', 'tutor-top'));
  const status = top.appendChild(el('span'));
  const fold = top.appendChild(el('button', '', '–'));
  fold.title = 'Fold the tutor away';
  const list = panel.appendChild(el('div', 'tutor-turns'));
  const compose = panel.appendChild(el('form', 'tutor-compose'));
  const context = compose.appendChild(el('div', 'tutor-context'));
  const contextText = context.appendChild(el('blockquote', 'tutor-on'));
  const forget = context.appendChild(el('button', '', '×'));
  forget.type = 'button';
  forget.title = 'Ask without this passage';
  const quick = compose.appendChild(el('div', 'tutor-quick'));
  const input = compose.appendChild(el('textarea'));
  input.rows = 2;
  input.maxLength = 1000;
  const sendButton = compose.appendChild(el('button', 'tutor-send', 'Send'));

  let listening = false, alive = true, draft = null, answered = 0;
  let shownTurns = '', shownNotes = '';

  function open(yes) {
    remembered.open = yes;
    panel.classList.toggle('tutor-open', yes);
    chip.classList.toggle('tutor-away', yes);
    if (yes) {
      chip.classList.remove('tutor-new');
      list.scrollTop = list.scrollHeight;
    }
  }
  chip.onclick = () => { open(true); input.focus(); };
  fold.onclick = () => open(false);

  function setDraft(d) {
    draft = d;
    context.classList.toggle('tutor-has', !!d);
    quick.classList.toggle('tutor-has', !!d);
    contextText.textContent = d ? clip(d.quote, 160) : '';
    input.placeholder = d ? 'Ask about this passage…' : 'Ask about what you are reading…';
  }
  forget.onclick = () => setDraft(null);

  function send(text) {
    text = text.trim();
    if (!text || !listening) return;
    post('say', { ...(draft || {}), text, url: location.pathname, title: document.title });
    input.value = '';
    setDraft(null);
    hideAsk();
    getSelection().removeAllRanges();
  }
  compose.onsubmit = e => { e.preventDefault(); send(input.value); };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); }
  });
  for (const [label, text] of Object.entries(QUICK)) {
    const b = quick.appendChild(el('button', '', label));
    b.type = 'button';
    b.onclick = () => send(text);
  }

  function renderTurns(turns) {
    list.textContent = '';
    if (!turns.length) {
      list.appendChild(el('p', 'tutor-empty', 'Ask anything about what you are reading. Select text on the page to ask about that passage.'));
    }
    for (const turn of turns) {
      const mine = list.appendChild(el('div', 'tutor-turn tutor-mine'));
      if (turn.page !== page) {
        const where = mine.appendChild(el('a', 'tutor-where', clip(turn.title || turn.page, 60)));
        where.href = turn.url;
      }
      if (turn.quote) mine.appendChild(el('blockquote', 'tutor-on', clip(turn.quote, 160)));
      mine.appendChild(el('p', '', turn.text));
      const theirs = list.appendChild(el('div', 'tutor-turn tutor-theirs' + (turn.html ? '' : ' tutor-waiting')));
      if (!turn.html) { theirs.textContent = 'Thinking…'; continue; }
      theirs.innerHTML = turn.html;
      if (turn.pinned) theirs.appendChild(el('p', 'tutor-pin', 'Pinned to the page'));
      else if (turn.quote) {
        const pin = theirs.appendChild(el('button', 'tutor-pin', 'Pin under the passage'));
        pin.onclick = () => post('pin', { turn: turn.id });
      }
    }
    list.scrollTop = list.scrollHeight;
  }

  function show(state) {
    listening = alive && state.listening;
    status.textContent = listening ? 'Tutor' : alive ? 'Tutor · not listening' : 'Tutor · session ended';
    chip.textContent = listening ? 'Ask the tutor' : 'Tutor offline';
    panel.classList.toggle('tutor-live', listening);
    chip.classList.toggle('tutor-live', listening);
    input.disabled = sendButton.disabled = !listening;
    if (!listening) {
      input.placeholder = alive
        ? 'No tutor is listening. Run /tutor in Claude Code in this repo.'
        : 'This tutor session has ended.';
    } else setDraft(draft);
    const turns = JSON.stringify(state.turns), notes = JSON.stringify(state.notes);
    if (turns !== shownTurns) {
      shownTurns = turns;
      renderTurns(state.turns);
      const now = state.turns.filter(t => t.html).length;
      if (now > answered && !panel.classList.contains('tutor-open')) chip.classList.add('tutor-new');
      answered = now;
    }
    if (notes !== shownNotes) { shownNotes = notes; renderNotes(state.notes); }
  }

  let last = { listening: false, turns: [], notes: [] };
  if (web) {
    last.notes = load();
    // a note written in another tab of this browser
    addEventListener('storage', e => { if (e.key === KEY) renderNotes(load()); });
  } else {
    const stream = new EventSource('/tutor/api/stream?page=' + page);
    stream.onmessage = e => { alive = true; last = JSON.parse(e.data); show(last); };
    // the server stops when the agent's session does; the chat stays readable but cannot be added to
    stream.onerror = () => { alive = false; show(last); };
  }

  /* ---------- selecting text to ask about ---------- */

  const ask = el('div', 'tutor-ask');
  const askTutor = ask.appendChild(el('button', '', 'Ask the tutor'));
  const addNote = ask.appendChild(el('button', '', 'Add a note'));
  ask.addEventListener('mousedown', e => e.preventDefault());  // keep the selection it is about
  askTutor.onclick = () => { ask.remove(); open(true); input.focus(); };
  addNote.onclick = e => { e.stopPropagation(); if (draft) writeNote(draft, ask); ask.remove(); };
  function hideAsk() { ask.remove(); }

  function offer() {
    const typing = document.activeElement && document.activeElement.closest('.tutor-panel, .tutor-diff');
    if (typing && getSelection().isCollapsed) return;
    const sel = getSelection();
    const range = sel.rangeCount && !sel.isCollapsed && sel.getRangeAt(0);
    const quote = range ? textIn(range) : '';
    const start = quote && elementOf(range.startContainer);
    if (!start || quote.length < 3 || quote.length > 1500 || start.closest(OURS + ', button, input, textarea, svg, .bar')) {
      hideAsk();
      // with the panel folded, letting go of the text lets go of the context too
      if (!panel.classList.contains('tutor-open')) setDraft(null);
      return;
    }
    const section = start.closest('section[id], header[id], footer[id]');
    const root = section || document.body;
    const block = elementOf(range.endContainer).closest(BLOCK);
    const before = document.createRange(), after = document.createRange();
    before.selectNodeContents(root); before.setEnd(range.startContainer, range.startOffset);
    after.selectNodeContents(root); after.setStart(range.endContainer, range.endOffset);
    setDraft({
      section: section ? section.id : '',
      quote,
      prefix: textIn(before).slice(-40),
      suffix: textIn(after).slice(0, 40),
      block: block ? norm(block.textContent) : quote,
    });
    askTutor.hidden = panel.classList.contains('tutor-open') || !listening;
    document.body.appendChild(ask);
    const rect = range.getBoundingClientRect();
    const below = rect.bottom + ask.offsetHeight + 12 < innerHeight;
    ask.style.top = scrollY + (below ? rect.bottom + 8 : rect.top - ask.offsetHeight - 8) + 'px';
    ask.style.left = scrollX + Math.max(8, Math.min(rect.left, innerWidth - ask.offsetWidth - 8)) + 'px';
  }

  let timer;
  document.addEventListener('selectionchange', () => { clearTimeout(timer); timer = setTimeout(offer, 350); });
  document.addEventListener('mouseup', e => {
    if (!panel.contains(e.target) && !ask.contains(e.target) && !(diffBox && diffBox.contains(e.target))) { clearTimeout(timer); timer = setTimeout(offer, 10); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { hideAsk(); closeDiff(); } });

  setDraft(null);
  open(remembered.open);
  show(last);
})();
