/* js/app.js — ExpenseIQ Core Logic */

/* ═══════════════════════════════════════
   CATEGORY CONFIG
   ═══════════════════════════════════════ */
var CATS = {
  Food:     { emoji: '🍕', color: '#f97070', tag: 'tag-food' },
  Travel:   { emoji: '✈️', color: '#38bdf8', tag: 'tag-travel' },
  Bills:    { emoji: '📄', color: '#facc15', tag: 'tag-bills' },
  Shopping: { emoji: '🛍️', color: '#a78bfa', tag: 'tag-shopping' },
  Health:   { emoji: '💊', color: '#f472b6', tag: 'tag-health' },
  Other:    { emoji: '📦', color: '#94a3b8', tag: 'tag-other' }
};

/* ═══════════════════════════════════════
   SMART NOTE VALIDATOR
   ═══════════════════════════════════════ */
var CAT_KEYWORDS = {
  Food: [
    'biryani','lunch','dinner','breakfast','coffee','tea','pizza','burger','sandwich','snack',
    'restaurant','canteen','eat','meal','food','cafe','sweets','thali','dal','rice','roti',
    'dosa','idli','chai','juice','milk','grocery','vegetable','fruit','chicken','paneer',
    'paratha','maggi','noodles','bread','biscuit','cake','ice cream','dessert','veg','non-veg',
    'hotel food','tiffin','dabba','swiggy','zomato','snacks','water bottle'
  ],
  Travel: [
    'uber','ola','auto','cab','rickshaw','bus','train','flight','metro','petrol','diesel',
    'fuel','ticket','toll','parking','taxi','rapido','airfare','booking','trip','commute',
    'rapido','byke','bike taxi','railway','irctc','travel','fare','transport','shuttle',
    'boat','ferry','airport','station'
  ],
  Bills: [
    'electricity','water','rent','internet','mobile','recharge','netflix','hotstar','prime',
    'subscription','emi','insurance','bill','wifi','broadband','gas','maintenance','society',
    'phone bill','dth','jio','airtel','vi','bsnl','postpaid','prepaid','data plan','utility'
  ],
  Shopping: [
    'clothes','shoes','amazon','flipkart','mall','earphones','laptop','phone','gadget','shirt',
    'dress','jeans','watch','accessories','myntra','meesho','online','order','bag','wallet',
    'cap','jacket','hoodie','kurta','saree','tops','shorts','delivery','product','appliance',
    'headphones','tablet','charger','cable','cover','case'
  ],
  Health: [
    'medicine','pharmacy','doctor','hospital','gym','tablet','capsule','clinic','checkup',
    'medical','health','dental','eye','test','lab','chemist','apollo','wellness','vaccination',
    'consultation','physiotherapy','blood test','scan','prescription','band-aid','sanitizer',
    'mask','yoga','fitness'
  ]
};

var autoTypingTimer = null; /* debounce timer */

function validateNote() {
  /* Debounce — wait 400ms after user stops typing */
  clearTimeout(autoTypingTimer);
  autoTypingTimer = setTimeout(function () { _doAutoCat(); }, 400);
}

function _doAutoCat() {
  var note   = (document.getElementById('expNote').value || '').trim().toLowerCase();
  var valDiv = document.getElementById('noteValidation');
  var msgEl  = document.getElementById('noteValMsg');
  var iconEl = document.getElementById('noteValIcon');
  var swBtn  = document.getElementById('noteValSwitch');
  swBtn.style.display = 'none';

  if (!note || note.length < 3) { valDiv.style.display = 'none'; return; }

  /* Score every category */
  var score = {};
  Object.keys(CAT_KEYWORDS).forEach(function (cat) {
    CAT_KEYWORDS[cat].forEach(function (kw) {
      if (note.includes(kw)) score[cat] = (score[cat] || 0) + 1;
    });
  });

  var cats = Object.keys(score);
  if (!cats.length) { valDiv.style.display = 'none'; return; }

  /* Best match */
  var best = cats.sort(function (a, b) { return score[b] - score[a]; })[0];
  var current = document.getElementById('expCategory').value;
  var c = CATS[best];

  if (best !== current) {
    /* ✨ AUTO-SWITCH — apply immediately */
    document.getElementById('expCategory').value      = best;
    document.getElementById('catSelected').textContent = c.emoji + ' ' + best;

    /* Flash the dropdown to draw attention */
    var trigger = document.getElementById('catTrigger');
    trigger.classList.add('auto-flash');
    setTimeout(function () { trigger.classList.remove('auto-flash'); }, 700);

    /* Show banner: auto-categorized */
    valDiv.className     = 'note-validation ok';
    iconEl.textContent   = '✨';
    msgEl.textContent    = 'Auto-categorized as ' + c.emoji + ' ' + best;
    valDiv.style.display = 'flex';
  } else {
    /* Already on the right category — just confirm */
    valDiv.className     = 'note-validation ok';
    iconEl.textContent   = '✅';
    msgEl.textContent    = best + ' — looks right!';
    valDiv.style.display = 'flex';
  }
}



var currentFilter = 'month';

/* Chart-driven filter (date or category click) */
var chartFilter = { type: null, value: null, label: null, color: null };

function filterByDate(date, label) {
  chartFilter = { type: 'date', value: date, label: label, color: '#6d56fa' };
  if (Charts.resetDonutSel) Charts.resetDonutSel();
  renderList();
  document.getElementById('list-card') &&
    document.getElementById('list-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  // also scroll to list panel
  var lc = document.querySelector('.list-card');
  if (lc) lc.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterByCategory(cat, color) {
  chartFilter = { type: 'category', value: cat, label: cat, color: color || '#6d56fa' };
  if (Charts.resetBarSel) Charts.resetBarSel();
  renderList();
  var lc = document.querySelector('.list-card');
  if (lc) lc.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearChartFilter() {
  chartFilter = { type: null, value: null, label: null, color: null };
  if (Charts.resetDonutSel) Charts.resetDonutSel();
  if (Charts.resetBarSel)   Charts.resetBarSel();
  renderList();
}

/* ═══════════════════════════════════════
   STORAGE
   ═══════════════════════════════════════ */
var Store = (function () {
  var K_EXP  = 'eiq2_exp';
  var K_BUDG = 'eiq2_budget';
  var K_DEMO = 'eiq2_demo';

  return {
    getAll:       function ()  { return JSON.parse(localStorage.getItem(K_EXP)  || '[]'); },
    save:         function (a) { localStorage.setItem(K_EXP, JSON.stringify(a)); },
    getBudget:    function ()  { return parseFloat(localStorage.getItem(K_BUDG) || '0'); },
    setBudget:    function (v) { localStorage.setItem(K_BUDG, String(v)); },
    isDemoLoaded: function ()  { return !!localStorage.getItem(K_DEMO); },
    markDemo:     function ()  { localStorage.setItem(K_DEMO, '1'); }
  };
})();

/* ═══════════════════════════════════════
   TOAST  (declared early so ai.js can use it)
   ═══════════════════════════════════════ */
function showToast(msg, type) {
  var prev = document.querySelector('.toast');
  if (prev) prev.remove();
  var t = document.createElement('div');
  t.className = 'toast ' + (type === 'error' ? 'err' : 'ok');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () { t.remove(); }, 3000);
}

/* ═══════════════════════════════════════
   DEMO DATA
   ═══════════════════════════════════════ */
function loadDemoData() {
  if (Store.isDemoLoaded()) return;
  var now = new Date();
  function d(n) {
    var x = new Date(now);
    x.setDate(x.getDate() - n);
    return x.toISOString().split('T')[0];
  }
  Store.save([
    { id: 2001, amount: 450,  category: 'Food',     date: d(0), note: 'Lunch at college canteen' },
    { id: 2002, amount: 1200, category: 'Travel',   date: d(1), note: 'Uber to airport' },
    { id: 2003, amount: 300,  category: 'Travel',   date: d(2), note: 'Auto rickshaw' },
    { id: 2004, amount: 2500, category: 'Bills',    date: d(3), note: 'Electricity bill' },
    { id: 2005, amount: 800,  category: 'Shopping', date: d(4), note: 'New earphones' },
    { id: 2006, amount: 350,  category: 'Health',   date: d(5), note: 'Pharmacy' },
    { id: 2007, amount: 600,  category: 'Food',     date: d(6), note: 'Dinner with friends' },
    { id: 2008, amount: 1500, category: 'Shopping', date: d(7), note: 'New shoes' }
  ]);
  Store.setBudget(12000);
  Store.markDemo();
}

/* ═══════════════════════════════════════
   NAVBAR SCROLL
   ═══════════════════════════════════════ */
window.addEventListener('scroll', function () {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

/* ═══════════════════════════════════════
   CUSTOM CATEGORY SELECT
   ═══════════════════════════════════════ */
function toggleCatDropdown() {
  var t = document.getElementById('catTrigger');
  var m = document.getElementById('catMenu');
  t.classList.toggle('open');
  m.classList.toggle('open');
}

function selectCat(el) {
  document.getElementById('expCategory').value        = el.dataset.val;
  document.getElementById('catSelected').textContent  = el.textContent;
  document.getElementById('catTrigger').classList.remove('open');
  document.getElementById('catMenu').classList.remove('open');
}

document.addEventListener('click', function (e) {
  var w = document.getElementById('catSelectWrap');
  if (w && !w.contains(e.target)) {
    document.getElementById('catTrigger').classList.remove('open');
    document.getElementById('catMenu').classList.remove('open');
  }
});

/* ═══════════════════════════════════════
   FILTER TABS
   ═══════════════════════════════════════ */
function setFilter(btn, filter) {
  currentFilter = filter;
  document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
  btn.classList.add('active');
  renderList();
  updateStats();
}

/* ═══════════════════════════════════════
   DATA HELPERS
   ═══════════════════════════════════════ */
function getMonthExpenses() {
  var now = new Date(), m = now.getMonth(), y = now.getFullYear();
  return Store.getAll().filter(function (e) {
    var d = new Date(e.date);
    return d.getMonth() === m && d.getFullYear() === y;
  });
}

function getPeriodExpenses() {
  var all   = Store.getAll();
  var now   = new Date();
  var today = now.toISOString().split('T')[0];
  if (currentFilter === 'today') return all.filter(function(e){ return e.date === today; });
  if (currentFilter === 'week')  {
    var w = new Date(now); w.setDate(w.getDate() - 7);
    return all.filter(function(e){ return new Date(e.date) >= w; });
  }
  if (currentFilter === 'month') return getMonthExpenses();
  return all;
}

function getFiltered() {
  var base   = getPeriodExpenses();
  var search = document.getElementById('searchInput').value.trim().toLowerCase();
  var sort   = document.getElementById('sortSel').value;

  if (search) base = base.filter(function (e) {
    return e.note.toLowerCase().includes(search) || e.category.toLowerCase().includes(search);
  });

  /* Apply chart filter on top */
  if (chartFilter.type === 'date') {
    base = Store.getAll().filter(function (e) { return e.date === chartFilter.value; });
  } else if (chartFilter.type === 'category') {
    base = Store.getAll().filter(function (e) { return e.category === chartFilter.value; });
    if (search) base = base.filter(function(e){ return e.note.toLowerCase().includes(search); });
  }

  base.sort(function (a, b) {
    if (sort === 'newest')  return (new Date(b.date) - new Date(a.date)) || (b.id - a.id);
    if (sort === 'oldest')  return (new Date(a.date) - new Date(b.date)) || (a.id - b.id);
    if (sort === 'highest') return b.amount - a.amount;
    if (sort === 'lowest')  return a.amount - b.amount;
    return 0;
  });
  return base;
}

/* ═══════════════════════════════════════
   COUNT-UP ANIMATION
   ═══════════════════════════════════════ */
function countUp(el, to, rupee) {
  var from  = 0;
  var dur   = 1200;
  var start = null;
  function step(ts) {
    if (!start) start = ts;
    var p   = Math.min((ts - start) / dur, 1);
    var e   = 1 - Math.pow(1 - p, 3);
    var val = Math.round(from + (to - from) * e);
    el.textContent = rupee ? '₹' + val.toLocaleString('en-IN') : val.toLocaleString('en-IN');
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ═══════════════════════════════════════
   UPDATE STATS
   ═══════════════════════════════════════ */
function updateStats() {
  var period  = getPeriodExpenses();
  var total   = period.reduce(function (s, e) { return s + e.amount; }, 0);
  var daysIn  = new Date().getDate();
  var avgDay  = Math.round(total / Math.max(daysIn, 1));

  countUp(document.getElementById('statTotal'), total, true);
  countUp(document.getElementById('statTx'),    period.length, false);
  countUp(document.getElementById('statAvg'),   avgDay, true);

  // Top category
  var catMap = {};
  period.forEach(function (e) { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
  var sorted = Object.keys(catMap).sort(function (a, b) { return catMap[b] - catMap[a]; });
  var catEl  = document.getElementById('statCat');
  var catAmt = document.getElementById('statCatAmt');
  if (sorted.length) {
    var c = CATS[sorted[0]] || CATS.Other;
    catEl.textContent  = c.emoji + ' ' + sorted[0];
    catAmt.textContent = '₹' + catMap[sorted[0]].toLocaleString('en-IN');
  } else {
    catEl.textContent  = '—';
    catAmt.textContent = '';
  }

  // Trend
  var all  = Store.getAll();
  var now  = new Date();
  var ws   = new Date(now); ws.setDate(ws.getDate() - 7);
  var lws  = new Date(ws);  lws.setDate(lws.getDate() - 7);
  var thisW = all.filter(function(e){ var d=new Date(e.date); return d>=ws && d<=now; }).reduce(function(s,e){return s+e.amount;},0);
  var lastW = all.filter(function(e){ var d=new Date(e.date); return d>=lws && d<ws;  }).reduce(function(s,e){return s+e.amount;},0);

  var tb = document.getElementById('trendBadge');
  if (!lastW) {
    tb.innerHTML = '';
  } else if (thisW > lastW) {
    var pct = Math.round((thisW - lastW) / lastW * 100);
    tb.innerHTML = '<span class="trend-pill up">↑ ' + pct + '% vs last week</span>';
  } else {
    var pct = Math.round((lastW - thisW) / lastW * 100);
    tb.innerHTML = '<span class="trend-pill down">↓ ' + pct + '% vs last week</span>';
  }
}

/* ═══════════════════════════════════════
   UPDATE BUDGET RING
   ═══════════════════════════════════════ */
function updateBudget() {
  var budget = Store.getBudget();
  var spent  = getMonthExpenses().reduce(function (s, e) { return s + e.amount; }, 0);
  document.getElementById('budgetInput').value = budget || '';
  document.getElementById('budgSpent').textContent  = '₹' + spent.toLocaleString('en-IN');

  var ring = document.getElementById('ringFill');
  var pctEl  = document.getElementById('ringPct');
  // r=60 → C = 2π×60 ≈ 376.99
  var C = 2 * Math.PI * 60;
  ring.style.strokeDasharray = C;

  if (!budget) {
    ring.style.strokeDashoffset = C;
    pctEl.textContent = '—';
    document.getElementById('budgRemain').textContent = '—';
    document.getElementById('budgetAlert').textContent = '';
    document.getElementById('budgetAlert').className    = 'budget-alert';
    return;
  }

  var pct    = Math.min(spent / budget * 100, 100);
  var remain = Math.max(budget - spent, 0);
  document.getElementById('budgRemain').textContent = '₹' + remain.toLocaleString('en-IN');

  // Ring color
  var color = pct >= 100 ? '#f0455a' : pct >= 80 ? '#f59e0b' : '#00c896';
  ring.style.stroke = color;

  // Animate ring + pct text
  var target = C - (pct / 100) * C;
  var start  = null;
  var dur    = 900;
  function step(ts) {
    if (!start) start = ts;
    var p    = Math.min((ts - start) / dur, 1);
    var ease = 1 - Math.pow(1 - p, 3);
    ring.style.strokeDashoffset = C - (C - target) * ease;
    pctEl.textContent = Math.round(pct * ease) + '%';
    if (p < 1) requestAnimationFrame(step);
  }
  ring.style.strokeDashoffset = C; // reset before animation
  requestAnimationFrame(step);

  // Alert text
  var alertEl = document.getElementById('budgetAlert');
  if (pct >= 100) {
    alertEl.textContent = '🚨 Budget exceeded this month.';
    alertEl.className   = 'budget-alert over';
  } else if (pct >= 80) {
    alertEl.textContent = '⚠️ ' + Math.round(pct) + '% of budget used.';
    alertEl.className   = 'budget-alert warn';
  } else {
    alertEl.textContent = '';
    alertEl.className   = 'budget-alert';
  }
}

/* ═══════════════════════════════════════
   SAVE BUDGET
   ═══════════════════════════════════════ */
function saveBudget() {
  var v = parseFloat(document.getElementById('budgetInput').value);
  if (!v || v <= 0) { showToast('Enter a valid budget amount', 'error'); return; }
  Store.setBudget(v);
  var btn = document.getElementById('btnSetBudget');
  btn.textContent = '✓';
  setTimeout(function () { btn.textContent = 'Set'; }, 1200);
  showToast('Budget saved ✓', 'success');
  updateBudget();
}

function focusBudget() {
  document.getElementById('budgetInput').focus();
}

/* ═══════════════════════════════════════
   CATEGORY BREAKDOWN
   ═══════════════════════════════════════ */
function updateBreakdown() {
  var month  = getMonthExpenses();
  var total  = month.reduce(function (s, e) { return s + e.amount; }, 0);
  var catMap = {};
  month.forEach(function (e) { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
  var sorted = Object.keys(catMap).sort(function (a, b) { return catMap[b] - catMap[a]; });

  var el = document.getElementById('breakdownList');
  if (!sorted.length) { el.innerHTML = '<p style="font-size:12px;color:var(--text-3)">No data yet</p>'; return; }

  el.innerHTML = sorted.map(function (cat) {
    var amt  = catMap[cat];
    var pct  = total ? Math.round(amt / total * 100) : 0;
    var c    = CATS[cat] || CATS.Other;
    return [
      '<div class="bk-item">',
      '  <div class="bk-dot" style="background:' + c.color + '"></div>',
      '  <span class="bk-name">' + cat + '</span>',
      '  <div class="bk-bar"><div class="bk-fill" style="width:' + pct + '%;background:' + c.color + '"></div></div>',
      '  <span class="bk-amt">₹' + amt.toLocaleString('en-IN') + '</span>',
      '</div>'
    ].join('');
  }).join('');
}

/* ═══════════════════════════════════════
   ADD EXPENSE
   ═══════════════════════════════════════ */
function addExpense() {
  var rawAmt   = document.getElementById('expAmount').value;
  var amount   = parseFloat(rawAmt);
  var category = document.getElementById('expCategory').value;
  var date     = document.getElementById('expDate').value;
  var note     = document.getElementById('expNote').value.trim();

  /* ── Strict validation ── */
  if (!rawAmt || isNaN(amount) || amount <= 0) {
    showToast('Enter a valid amount', 'error'); return;
  }
  if (amount < 1) {
    showToast('Minimum amount is ₹1', 'error'); return;
  }
  if (amount > 1000000) {
    showToast('Amount seems too high (max ₹10,00,000)', 'error'); return;
  }
  if (!date) { showToast('Pick a date', 'error'); return; }
  if (date > new Date().toISOString().split('T')[0]) {
    showToast('Future dates not allowed', 'error'); return;
  }
  if (!note) { showToast('Add a note', 'error'); return; }

  /* ── Save ── */
  var rounded = Math.round(amount * 100) / 100; // max 2 decimal places
  var all = Store.getAll();
  all.unshift({ id: Date.now(), amount: rounded, category: category, date: date, note: note });
  Store.save(all);

  /* ── Reset form + clear validation banner ── */
  document.getElementById('expAmount').value = '';
  document.getElementById('expNote').value   = '';
  document.getElementById('noteValidation').style.display = 'none';

  var btn   = document.getElementById('btnAdd');
  var label = document.getElementById('btnAddLabel');
  btn.classList.add('success');
  label.textContent = '✓ Added';
  setTimeout(function () {
    btn.classList.remove('success');
    label.textContent = 'Add Expense';
  }, 1200);

  showToast('Expense recorded ✓', 'success');
  refresh();
}

/* ═══════════════════════════════════════
   DELETE EXPENSE
   ═══════════════════════════════════════ */
function deleteExpense(id) {
  var row = document.querySelector('[data-id="' + id + '"]');
  if (!row) return;

  /* Mark visually as pending-delete */
  row.style.transition = 'opacity 0.25s, transform 0.25s';
  row.style.opacity    = '0.35';
  row.style.transform  = 'translateX(-8px)';

  /* Show undo toast */
  var prev = document.querySelector('.toast'); if (prev) prev.remove();
  var t = document.createElement('div');
  t.className = 'toast undo-toast';
  t.innerHTML = '🗑 Deleted &nbsp;<button onclick="undoDelete(' + id + ',this)" style="background:rgba(255,255,255,0.15);border:none;color:#fff;padding:2px 10px;border-radius:4px;font:600 11px Inter,sans-serif;cursor:pointer;margin-left:4px">Undo</button>';
  document.body.appendChild(t);

  /* Actually delete after 4 seconds (undo window) */
  var timer = setTimeout(function () {
    t.remove();
    row.classList.add('deleting');
    setTimeout(function () {
      Store.save(Store.getAll().filter(function (e) { return e.id !== id; }));
      refresh();
    }, 300);
  }, 4000);

  /* Store timer so undo can cancel it */
  row.dataset.deleteTimer = timer;
}

function undoDelete(id, btn) {
  var row = document.querySelector('[data-id="' + id + '"]');
  if (!row) return;
  clearTimeout(parseInt(row.dataset.deleteTimer));
  row.style.opacity   = '';
  row.style.transform = '';
  var toast = btn.closest('.toast'); if (toast) toast.remove();
  showToast('Deletion cancelled ✓', 'success');
}

/* ═══════════════════════════════════════
   RENDER EXPENSE LIST
   ═══════════════════════════════════════ */
function renderList() {
  var listEl   = document.getElementById('expenseList');
  var expenses = getFiltered();

  /* Filter chip */
  var existingChip = document.getElementById('chartFilterChip');
  if (existingChip) existingChip.remove();
  if (chartFilter.type) {
    var chip = document.createElement('div');
    chip.id = 'chartFilterChip';
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:3px 10px 3px 10px;background:' +
      (chartFilter.color ? chartFilter.color + '20' : 'rgba(109,86,250,0.12)') +
      ';border:1px solid ' + (chartFilter.color || '#6d56fa') + '30' +
      ';border-radius:20px;font-size:11px;font-weight:600;color:' + (chartFilter.color || '#a78bfa') +
      ';margin-left:8px;cursor:pointer;transition:opacity 0.2s;';
    var icon = chartFilter.type === 'date' ? '📅' : '🏷️';
    chip.innerHTML = icon + ' ' + esc(chartFilter.label) +
      ' <span style="opacity:0.6;margin-left:2px;font-size:13px;line-height:1" title="Clear filter">×</span>';
    chip.onclick = function () { clearChartFilter(); };
    document.getElementById('listTitle').after(chip);
  }

  document.getElementById('listTitle').textContent = 'Expenses (' + expenses.length + ')';

  if (!expenses.length) {
    listEl.innerHTML = [
      '<div class="empty-state">',
      '<span class="empty-ico">📭</span>',
      '<p class="empty-msg">No expenses found</p>',
      '</div>'
    ].join('');
    return;
  }

  listEl.innerHTML = expenses.map(function (e, i) {
    var c    = CATS[e.category] || CATS.Other;
    var date = new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return [
      '<div class="exp-row" data-id="' + e.id + '" style="animation-delay:' + Math.min(i * 40, 300) + 'ms">',
      '  <div class="exp-icon" style="background:' + c.color + '18">' + c.emoji + '</div>',
      '  <div class="exp-info">',
      '    <div class="exp-note">' + esc(e.note) + '</div>',
      '    <div class="exp-meta">',
      '      <span class="cat-tag ' + c.tag + '">' + e.category + '</span>',
      '      <span class="exp-date">' + date + '</span>',
      '    </div>',
      '  </div>',
      '  <div class="exp-amount">₹' + e.amount.toLocaleString('en-IN') + '</div>',
      '  <button class="exp-del" onclick="deleteExpense(' + e.id + ')" title="Delete">',
      '    <svg viewBox="0 0 12 12" fill="none" width="11" height="11"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
      '  </button>',
      '</div>'
    ].join('');
  }).join('');
}

/* ═══════════════════════════════════════
   REFRESH ALL
   ═══════════════════════════════════════ */
function refresh() {
  updateStats();
  updateBudget();
  updateBreakdown();
  renderList();
  Charts.updateDonut(getMonthExpenses());
  Charts.updateBar(Store.getAll());
}

/* ═══════════════════════════════════════
   EXPORT CSV
   ═══════════════════════════════════════ */
function exportCSV() {
  /* Export respects the currently visible filtered list */
  var data = chartFilter.type ? getFiltered() : Store.getAll();
  if (!data.length) { showToast('Nothing to export with current filter', 'error'); return; }

  var label = chartFilter.type ? ('_' + chartFilter.label.replace(/\s+/g,'_')) : '_all';
  var csv  = 'Amount,Category,Date,Note\n' +
             data.map(function (e) {
               return e.amount + ',' + e.category + ',' + e.date + ',"' + e.note.replace(/"/g, '""') + '"';
             }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url;
  a.download = 'expenseiq' + label + '_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported ' + data.length + ' expenses ✓', 'success');
}

/* ═══════════════════════════════════════
   UTILITY
   ═══════════════════════════════════════ */
function esc(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/* ═══════════════════════════════════════
   PAGE DATE
   ═══════════════════════════════════════ */
function setPageDate() {
  var el = document.getElementById('pageDate');
  if (el) {
    el.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
}

/* ═══════════════════════════════════════
   INIT
   ═══════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', function () {
  document.getElementById('expDate').value = new Date().toISOString().split('T')[0];
  setPageDate();
  loadDemoData();
  refresh();
});
