// Atlas — Vantage's built-in guide. Wires the "Ask Atlas" button on every page,
// offers a spotlight walkthrough of each screen, and greets new users once.
// Standalone vanilla JS; lives outside the React tree so re-renders never touch it.
(function () {
  'use strict';
  if (window.VantageAtlas) return;

  // ---------- session ----------
  function sessionRaw() {
    var s = null;
    try { s = localStorage.getItem('pd-session'); } catch (e) {}
    if (!s) { try { s = sessionStorage.getItem('pd-session'); } catch (e) {} }
    if (!s && window.name && window.name.indexOf('pd-session:') === 0) s = window.name.slice(11);
    try { return JSON.parse(s || 'null'); } catch (e) { return null; }
  }
  function userName() { var s = sessionRaw(); return (s && s.name) || 'there'; }
  function pageName() {
    var p = location.pathname;
    try { p = decodeURIComponent(p); } catch (e) {}
    return (p.split('/').pop() || '').replace(/\.dc\.html$/, '') || 'Overview';
  }

  // ---------- styles ----------
  var style = document.createElement('style');
  style.textContent = [
    '#atlas-panel{position:fixed;right:28px;bottom:88px;z-index:300;width:330px;background:#FFFFFF;border:1px solid #ECE8DE;border-radius:16px;box-shadow:0 16px 48px rgba(14,31,43,0.22);font-family:Inter,sans-serif;color:#0E1F2B;overflow:hidden;display:none;}',
    '#atlas-panel.atlas-open{display:block;animation:atlasPop .22s ease;}',
    '@keyframes atlasPop{0%{opacity:0;transform:translateY(10px) scale(.98);}100%{opacity:1;transform:none;}}',
    '.atlas-head{background:#0E1F2B;color:#F7F6F2;padding:16px 18px;display:flex;align-items:center;gap:12px;}',
    '.atlas-avatar{position:relative;width:34px;height:34px;border-radius:50%;background:rgba(63,191,127,0.16);border:1px solid rgba(63,191,127,0.4);color:#3FBF7F;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;}',
    '.atlas-avatar::after{content:"";position:absolute;top:-1px;right:-1px;width:9px;height:9px;border-radius:50%;background:#3FBF7F;border:2px solid #0E1F2B;}',
    '.atlas-body{padding:16px 18px 18px;}',
    '.atlas-greet{margin:0 0 12px;font-size:13px;line-height:1.6;color:#4A5560;}',
    '.atlas-cta{font-family:inherit;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;font-size:13.5px;font-weight:600;color:#F7F6F2;background:#159B5A;border:none;border-radius:10px;padding:12px 16px;cursor:pointer;}',
    '.atlas-cta:hover{background:#0F7A46;}',
    '.atlas-list-title{margin:16px 0 6px;font-size:11px;font-weight:700;color:#A9A294;letter-spacing:.06em;text-transform:uppercase;}',
    '.atlas-item{font-family:inherit;width:100%;display:flex;align-items:center;gap:10px;background:none;border:none;text-align:left;font-size:12.5px;font-weight:500;color:#0E1F2B;padding:8px 10px;border-radius:8px;cursor:pointer;}',
    '.atlas-item:hover{background:#F1EFE8;}',
    '.atlas-item .atlas-dot{width:6px;height:6px;border-radius:50%;background:#159B5A;flex-shrink:0;}',
    '.atlas-foot{border-top:1px solid #F0EDE4;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;}',
    '.atlas-foot a{font-size:12px;font-weight:600;color:#159B5A;text-decoration:none;}',
    '.atlas-foot span{font-size:11px;color:#A9A294;}',
    '#atlas-overlay{position:fixed;inset:0;z-index:400;cursor:pointer;}',
    '#atlas-spot{position:fixed;z-index:401;border-radius:14px;pointer-events:none;box-shadow:0 0 0 9999px rgba(14,31,43,0.58),0 0 0 3px rgba(63,191,127,0.9);transition:all .3s ease;}',
    '#atlas-card{position:fixed;z-index:402;width:340px;max-width:calc(100vw - 32px);background:#FFFFFF;border:1px solid #ECE8DE;border-radius:14px;box-shadow:0 18px 50px rgba(14,31,43,0.3);font-family:Inter,sans-serif;color:#0E1F2B;padding:16px 18px;transition:top .3s ease,left .3s ease;}',
    '.atlas-card-tag{display:flex;align-items:center;gap:8px;margin:0 0 8px;}',
    '.atlas-card-tag b{font-size:11px;font-weight:700;color:#159B5A;letter-spacing:.06em;text-transform:uppercase;}',
    '.atlas-card-title{margin:0 0 6px;font-size:15px;font-weight:600;}',
    '.atlas-card-body{margin:0 0 14px;font-size:13px;line-height:1.65;color:#4A5560;}',
    '.atlas-card-row{display:flex;align-items:center;justify-content:space-between;gap:10px;}',
    '.atlas-btn{font-family:inherit;font-size:12.5px;font-weight:600;border-radius:999px;padding:8px 16px;cursor:pointer;}',
    '.atlas-btn-next{color:#F7F6F2;background:#0E1F2B;border:none;}',
    '.atlas-btn-next:hover{background:#159B5A;}',
    '.atlas-btn-back{color:#6B7480;background:none;border:1px solid #E6E2D8;}',
    '.atlas-btn-back:hover{color:#0E1F2B;border-color:#0E1F2B;}',
    '.atlas-count{font-size:11.5px;color:#A9A294;font-variant-numeric:tabular-nums;}',
    '.atlas-x{position:absolute;top:10px;right:12px;font-family:inherit;background:none;border:none;color:#A9A294;font-size:15px;cursor:pointer;padding:2px 6px;}',
    '.atlas-x:hover{color:#0E1F2B;}',
    '#atlas-bubble{position:fixed;right:28px;bottom:88px;z-index:300;width:300px;background:#0E1F2B;color:#F7F6F2;border-radius:16px 16px 4px 16px;box-shadow:0 16px 48px rgba(14,31,43,0.3);font-family:Inter,sans-serif;padding:16px 18px;animation:atlasPop .3s ease;}',
    '#atlas-bubble p{margin:0 0 12px;font-size:13px;line-height:1.6;color:#D9DEE2;}',
    '#atlas-bubble b{color:#F7F6F2;}',
    '#atlas-fab{font-family:Inter,sans-serif;position:fixed;right:28px;bottom:28px;z-index:90;display:flex;align-items:center;gap:10px;background:#0E1F2B;color:#F7F6F2;border:none;cursor:pointer;padding:11px 18px 11px 12px;border-radius:999px;box-shadow:0 6px 20px rgba(14,31,43,0.22);font-size:13.5px;font-weight:600;}',
    '#atlas-fab:hover{background:#17303F;}'
  ].join('\n');
  document.head.appendChild(style);

  // ---------- tour content ----------
  var NAV_BODY = 'These tabs are the whole app. Overview is your daily home base. Learn teaches the ideas behind every number. Holdings lists what you own. Activity is where you log buys and contributions. Performance charts how it’s going. Plan lets you test what-ifs, and Reports collects your weekly dispatches. Your profile menu (top right) holds Settings and Feedback.';
  var DOCK_STEP = { sel: '#agent-dock, #atlas-fab', title: 'And this is me', body: 'I’m Atlas, your guide. Click "Ask Atlas" on any page and I’ll walk you through what everything on that screen means and where it comes from. For deeper explanations of the ideas themselves, the Learn tab has short courses, breakdowns and quizzes.' };

  var TOURS = {
    'Overview': [
      { sel: '[data-tour="personal"]', title: 'Built around you', body: 'Nothing on this page is generic. Your risk profile, target split, paycheck contributions and learning progress all come from what you told Vantage — change them any time from Profile or Settings and every page re-personalizes instantly.' },
      { sel: '[data-tour="hero"]', title: 'Your portfolio at a glance', body: 'Total value, the split between index funds and individual stocks, and what you’re adding per paycheck. These are your real entered numbers — Vantage never shows sample data.' },
      { sel: '[data-tour="chart"]', title: 'Value & allocation', body: 'The chart fills in nightly as closes are logged. The donut shows each holding’s share of the account — one giant wedge means one position decides your results, which is what the 25% concentration line watches for.' },
      { sel: '[data-tour="invest"]', title: 'Your next paycheck, suggested', body: 'A concrete split for your next contribution, sized to the amount you set and shaped by your risk profile. It always steers new money toward whatever eases your current flags.' },
      { sel: '[data-tour="week"]', title: 'The week in 60 seconds', body: 'What happened in markets, tied to your actual holdings — if tech sold off and you hold tech, it says so and by how much. It ends with the honest answer to "do I need to do anything?" (usually: no).' },
      { sel: '[data-tour="flag"]', title: 'The one flag', body: 'Eight standing rules run every weeknight: concentration, drift from target, fee hikes, dividend cuts. A tripped flag never trades anything — it just earns a plain-language paragraph here, with ways to respond on Plan.' },
      { sel: '[data-tour="ideas"]', title: 'The four ideas', body: 'Compounding, diversification, behavior and time in the market. Everything on this dashboard rests on these — the Learn tab expands each into a two-minute lesson.' }
    ],
    'Learn': [
      { sel: '[data-tour="upnext"]', title: 'Picked for you', body: 'Atlas keeps track of where you left off. This card always shows your next unfinished lesson and a recommendation based on your risk profile and quiz results — one click and you’re back in.' },
      { sel: '[data-tour="tabs"]', title: 'Five ways to learn', body: 'Courses are short reading tracks you tick off. Breakdowns explain every term on your dashboard in a minute. Quizzes tell you what kind of investor you are and check the basics. Videos link out to curated explainers, and the Forum is for anything the rest didn’t cover.' },
      { sel: 'main > section:nth-of-type(2)', title: 'This section', body: 'Progress saves automatically per profile, on this device — tick lessons off as you go and the "up next" card, the Overview page and your progress bar all stay in sync.' }
    ]
  };

  var PAGE_INTROS = {
    'Overview': 'your daily home base — everything here is personalized from your profile.',
    'Learn': 'short courses, breakdowns, quizzes and videos. It tracks your progress and recommends what to do next.',
    'Holdings': 'every position you’ve entered, with types, sizes and fees.',
    'Activity': 'the log of your buys and contributions — what you record here feeds every other page.',
    'Performance': 'charts, income estimates and the risk checks behind your flags.',
    'Plan': 'a sandbox — test contribution amounts and splits without touching anything real.',
    'Report': 'your weekly written dispatches, kept in one place.',
    'Profile': 'who Vantage thinks you are — risk profile, goals and account details.',
    'Settings': 'risk, contributions, guardrails and the database connection.',
    'Feedback': 'tell the maker of Vantage what to improve.',
    'Portfolio Dispatch': 'the long-form weekly letter about your account.'
  };

  function truncate(s, n) { s = (s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }

  function buildSteps() {
    var steps = [{ sel: 'nav', title: 'Getting around', body: NAV_BODY }];
    var custom = TOURS[pageName()];
    if (custom) {
      steps = steps.concat(custom);
    } else {
      // Generic walkthrough: one step per section, narrated from its own heading.
      var sections = document.querySelectorAll('main > section, main > div');
      Array.prototype.forEach.call(sections, function (sec, i) {
        var head = sec.querySelector('h1,h2,h3');
        var para = sec.querySelector('p');
        if (!head && !para) return;
        if (!sec.id) sec.id = 'atlas-sec-' + i;
        steps.push({
          sel: '#' + sec.id,
          title: head ? truncate(head.textContent, 60) : 'This section',
          body: para ? truncate(para.textContent, 220) : 'Everything in this block updates from your own entered data.'
        });
      });
    }
    steps.push(DOCK_STEP);
    return steps.filter(function (s) { return document.querySelector(s.sel); });
  }

  // ---------- tour engine ----------
  var tour = { steps: [], i: 0, overlay: null, spot: null, card: null, active: false };

  function endTour() {
    if (!tour.active) return;
    tour.active = false;
    [tour.overlay, tour.spot, tour.card].forEach(function (el) { if (el && el.parentNode) el.parentNode.removeChild(el); });
    tour.overlay = tour.spot = tour.card = null;
    window.removeEventListener('scroll', reposition, true);
    window.removeEventListener('resize', reposition);
    document.removeEventListener('keydown', onKey);
  }

  function reposition() {
    if (!tour.active) return;
    var step = tour.steps[tour.i];
    var el = document.querySelector(step.sel);
    if (!el) return;
    var r = el.getBoundingClientRect();
    var pad = 8;
    tour.spot.style.top = (r.top - pad) + 'px';
    tour.spot.style.left = (r.left - pad) + 'px';
    tour.spot.style.width = (r.width + pad * 2) + 'px';
    tour.spot.style.height = (r.height + pad * 2) + 'px';
    var card = tour.card;
    var cw = Math.min(340, window.innerWidth - 32);
    var ch = card.offsetHeight || 180;
    var left = Math.max(16, Math.min(r.left, window.innerWidth - cw - 16));
    var top = r.bottom + 16;
    if (top + ch > window.innerHeight - 12) top = r.top - ch - 16;
    if (top < 12) top = Math.max(12, (window.innerHeight - ch) / 2);
    card.style.left = left + 'px';
    card.style.top = top + 'px';
  }

  function onKey(e) {
    if (e.key === 'Escape') endTour();
    else if (e.key === 'ArrowRight' || e.key === 'Enter') go(tour.i + 1);
    else if (e.key === 'ArrowLeft') go(tour.i - 1);
  }

  function go(i) {
    if (i < 0) return;
    if (i >= tour.steps.length) { endTour(); return; }
    tour.i = i;
    var step = tour.steps[i];
    var el = document.querySelector(step.sel);
    if (!el) { go(i + 1); return; }
    var last = i === tour.steps.length - 1;
    tour.card.innerHTML =
      '<button class="atlas-x" title="End tour">✕</button>' +
      '<div class="atlas-card-tag"><span class="atlas-avatar" style="width:22px;height:22px;font-size:10px;">A</span><b>Atlas explains</b></div>' +
      '<p class="atlas-card-title"></p>' +
      '<p class="atlas-card-body"></p>' +
      '<div class="atlas-card-row">' +
        '<span class="atlas-count">' + (i + 1) + ' / ' + tour.steps.length + '</span>' +
        '<span style="display:flex;gap:8px;">' +
          (i > 0 ? '<button class="atlas-btn atlas-btn-back">← Back</button>' : '') +
          '<button class="atlas-btn atlas-btn-next">' + (last ? 'Done ✓' : 'Next →') + '</button>' +
        '</span>' +
      '</div>';
    tour.card.querySelector('.atlas-card-title').textContent = step.title;
    tour.card.querySelector('.atlas-card-body').textContent = step.body;
    tour.card.querySelector('.atlas-x').onclick = endTour;
    tour.card.querySelector('.atlas-btn-next').onclick = function () { go(tour.i + 1); };
    var back = tour.card.querySelector('.atlas-btn-back');
    if (back) back.onclick = function () { go(tour.i - 1); };
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(reposition, 60);
    setTimeout(reposition, 380);
  }

  function startTour(at) {
    closePanel(); removeBubble();
    endTour();
    tour.steps = buildSteps();
    if (!tour.steps.length) return;
    tour.active = true;
    tour.overlay = document.createElement('div'); tour.overlay.id = 'atlas-overlay';
    tour.overlay.onclick = function () { go(tour.i + 1); };
    tour.spot = document.createElement('div'); tour.spot.id = 'atlas-spot';
    tour.card = document.createElement('div'); tour.card.id = 'atlas-card';
    tour.card.onclick = function (e) { e.stopPropagation(); };
    document.body.appendChild(tour.overlay);
    document.body.appendChild(tour.spot);
    document.body.appendChild(tour.card);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('keydown', onKey);
    go(at || 0);
  }

  // ---------- panel ----------
  var panel = null;
  function closePanel() { if (panel) panel.classList.remove('atlas-open'); }
  function togglePanel() {
    removeBubble();
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'atlas-panel';
      document.body.appendChild(panel);
    }
    if (panel.classList.contains('atlas-open')) { closePanel(); return; }
    var name = userName();
    var page = pageName();
    var intro = PAGE_INTROS[page] || 'this screen.';
    var steps = buildSteps();
    var items = steps.map(function (s, i) {
      return '<button class="atlas-item" data-step="' + i + '"><span class="atlas-dot"></span>' +
        s.title.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</button>';
    }).join('');
    panel.innerHTML =
      '<div class="atlas-head"><span class="atlas-avatar">A</span>' +
        '<div><div style="font-size:14px;font-weight:600;">Atlas</div><div style="font-size:11px;color:#8DA0AD;">Your Vantage guide</div></div>' +
        '<button class="atlas-x" style="color:#8DA0AD;">✕</button></div>' +
      '<div class="atlas-body">' +
        '<p class="atlas-greet">Hi <b>' + name.replace(/</g, '&lt;') + '</b> — you’re on <b>' + page + '</b>: ' + intro + '</p>' +
        '<button class="atlas-cta" id="atlas-start">▶&nbsp; Walk me through this page</button>' +
        '<p class="atlas-list-title">Or jump straight to</p>' + items +
      '</div>' +
      '<div class="atlas-foot"><a href="Learn.dc.html">Open Learn →</a><span>Esc closes the tour</span></div>';
    panel.querySelector('.atlas-x').onclick = closePanel;
    panel.querySelector('#atlas-start').onclick = function () { startTour(0); };
    Array.prototype.forEach.call(panel.querySelectorAll('.atlas-item'), function (b) {
      b.onclick = function () { startTour(Number(b.getAttribute('data-step'))); };
    });
    panel.classList.add('atlas-open');
  }

  // ---------- first-visit bubble ----------
  var bubble = null;
  function removeBubble() { if (bubble && bubble.parentNode) bubble.parentNode.removeChild(bubble); bubble = null; }
  function maybeWelcome() {
    // Only offered to a brand-new user: onboarding's finish() sets this one-shot
    // flag, and it's consumed the first time they land on Overview.
    var pending = null;
    try { pending = localStorage.getItem('pd-atlas-tour-pending'); } catch (e) {}
    if (!pending || pageName() !== 'Overview') return;
    setTimeout(function () {
      if (tour.active || (panel && panel.classList.contains('atlas-open'))) return;
      bubble = document.createElement('div');
      bubble.id = 'atlas-bubble';
      bubble.innerHTML =
        '<p><b>Welcome aboard, ' + userName().replace(/</g, '&lt;') + '!</b> I’m Atlas. Your dashboard was just built from your onboarding answers — want me to walk you through what everything means?</p>' +
        '<div style="display:flex;gap:8px;">' +
          '<button class="atlas-btn atlas-btn-next" id="atlas-yes" style="background:#159B5A;">Show me around</button>' +
          '<button class="atlas-btn atlas-btn-back" id="atlas-no" style="color:#8DA0AD;border-color:#33454F;">Maybe later</button></div>';
      document.body.appendChild(bubble);
      var done = function () { try { localStorage.removeItem('pd-atlas-tour-pending'); } catch (e) {} removeBubble(); };
      bubble.querySelector('#atlas-yes').onclick = function () { done(); startTour(0); };
      bubble.querySelector('#atlas-no').onclick = done;
    }, 1400);
  }

  // ---------- wiring ----------
  // Delegated so React re-renders can't drop the listener.
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('#agent-launcher')) togglePanel();
  });

  // Pages without the agent dock get Atlas's own launcher.
  function ensureLauncher() {
    if (document.getElementById('agent-launcher') || document.getElementById('atlas-fab')) return;
    var b = document.createElement('button');
    b.id = 'atlas-fab';
    b.innerHTML = '<span class="atlas-avatar" style="width:30px;height:30px;font-size:13px;">A</span><span>Ask Atlas</span>';
    b.onclick = togglePanel;
    document.body.appendChild(b);
  }

  function init() {
    // Wait for the React app (and skeleton fade) before deciding on a fallback launcher.
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (document.getElementById('agent-launcher') || tries > 20) {
        clearInterval(t);
        ensureLauncher();
        maybeWelcome();
      }
    }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.VantageAtlas = { start: startTour, open: togglePanel, end: endTour };
})();
