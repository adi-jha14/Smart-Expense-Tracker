/* js/ai.js — Gemini AI Integration */
/* NOTE: This file must load AFTER app.js so Store & showToast are defined */

var AI = (function () {

  var API_KEY  = 'AIzaSyCmnqsidn-BxZlfP7wOrbbesSsAufzr1Qo';
  var API_URL  = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + API_KEY;
  var loading  = false; /* ← prevents concurrent calls

  var PROMPT = [
    'You are a sharp personal finance advisor for Indian students.',
    'Analyze the expenses below and respond with EXACTLY this format (no extra text):',
    '',
    '💡 INSIGHT 1: [specific observation with %]',
    '💡 INSIGHT 2: [specific observation with ₹ amounts]',
    '💡 INSIGHT 3: [spending pattern or anomaly]',
    '🎯 TIP: [one powerful, actionable saving tip]',
    '',
    'Rules: Be specific with the actual numbers. Each line must be under 20 words.'
  ].join('\n');

  /* ── OPEN ── */
  function open() {
    if (loading) return; /* Prevent spam */

    var overlay  = document.getElementById('aiOverlay');
    var modalEl  = document.getElementById('aiModal');
    var bodyEl   = document.getElementById('aiBody');

    var expenses = Store.getAll();
    if (!expenses.length) {
      showToast('Add some expenses first', 'error');
      return;
    }

    modalEl.classList.remove('closing');
    overlay.classList.add('active');
    showLoading(bodyEl);
    setButtonState(true);
    call(expenses, bodyEl);
  }

  /* ── CLOSE ── */
  function close(evt, force) {
    var overlay = document.getElementById('aiOverlay');
    var modalEl = document.getElementById('aiModal');
    if (evt && evt.target !== overlay && !force) return;
    modalEl.classList.add('closing');
    setTimeout(function () {
      overlay.classList.remove('active');
      modalEl.classList.remove('closing');
    }, 260);
  }

  /* ── BUTTON STATE ── */
  function setButtonState(busy) {
    loading = busy;
    var btn = document.getElementById('btnAI');
    if (!btn) return;
    btn.disabled   = busy;
    btn.style.opacity = busy ? '0.65' : '';
    btn.style.cursor  = busy ? 'not-allowed' : '';
  }

  /* ── LOADING STATE ── */
  function showLoading(el) {
    el.innerHTML = [
      '<div class="ai-loading">',
      '  <div class="ai-dots">',
      '    <div class="ai-dot"></div>',
      '    <div class="ai-dot"></div>',
      '    <div class="ai-dot"></div>',
      '  </div>',
      '  <p>Analyzing your spending…</p>',
      '</div>'
    ].join('');
  }

  /* ── API CALL ── */
  function call(expenses, bodyEl) {
    var lines = expenses.map(function (e) {
      return '₹' + e.amount + ' — ' + e.category + ' — "' + e.note + '" — ' + e.date;
    }).join('\n');

    var payload = {
      contents: [{
        parts: [{ text: PROMPT + '\n\nExpenses:\n' + lines }]
      }]
    };

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (err) {
          throw new Error((err.error && err.error.message) || ('HTTP ' + res.status));
        });
        return res.json();
      })
      .then(function (data) {
        var text = data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0] &&
          data.candidates[0].content.parts[0].text;
        if (!text) throw new Error('Empty response from Gemini');
        render(text, bodyEl);
        setButtonState(false);
      })
      .catch(function (err) {
        setButtonState(false);
        bodyEl.innerHTML = [
          '<div class="ai-error-box">',
          '  <span class="err-emoji">😔</span>',
          '  <p><strong>Couldn\'t fetch insights right now.</strong></p>',
          '  <p class="err-detail">' + esc(err.message) + '</p>',
          '</div>'
        ].join('');
      });
  }

  /* ── RENDER INSIGHTS ── */
  function render(text, bodyEl) {
    var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);

    bodyEl.innerHTML = lines.map(function (line) {
      return '<div class="insight-card">' + fmt(line) + '</div>';
    }).join('');

    /* Staggered reveal */
    var cards = bodyEl.querySelectorAll('.insight-card');
    cards.forEach(function (c, i) {
      setTimeout(function () { c.classList.add('show'); }, 80 + i * 160);
    });
  }

  /* ── FORMAT LINE ── */
  function fmt(line) {
    var s = esc(line);
    s = s.replace(/(💡 INSIGHT \d+:|🎯 TIP:)/g, '<strong style="color:var(--accent)">$1</strong>');
    s = s.replace(/(₹[\d,]+)/g, '<strong style="color:var(--mint)">$1</strong>');
    s = s.replace(/(\d+\.?\d*\s*%)/g, '<strong style="color:var(--warning)">$1</strong>');
    return s;
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ── PUBLIC ── */
  return { open: open, close: close };

})();

/* Global hooks (called from HTML onclick) */
function openAIModal() { AI.open(); }
function closeAIModal(e, force) { AI.close(e, force); }
