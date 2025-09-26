/* wiki/wiki.js — small SPA injector, lock icons, snow */

// --- Config ---
const DEFAULT_PAGE = 'pages/activity-tracking.html';

// helper to fetch & inject page into #mainframe
async function loadPage(pagePath, scrollToId) {
  const main = document.getElementById('mainframe');
  main.innerHTML = '<div class="loading">Loading…</div>';

  try {
    const res = await fetch(pagePath, {cache: "no-cache"});
    if (!res.ok) throw new Error('Page not found: ' + pagePath);
    const html = await res.text();
    main.innerHTML = html;
    addLockIcons(pagePath);
    // if we have an id to scroll to, do that after small delay to let layout settle
    if (scrollToId) {
      setTimeout(()=> scrollToIdFn(scrollToId), 60);
    } else {
      // if fragment present in URL, scroll to it
      const frag = location.hash.replace('#', '');
      if (frag) setTimeout(()=> scrollToIdFn(frag), 60);
    }
  } catch (err) {
    main.innerHTML = `<div class="loading">Could not load page: ${err.message}</div>`;
  }
}

// create lock icons for headings
function addLockIcons(currentPage) {
  const main = document.getElementById('mainframe');
  // attach to h1,h2,h3 that have an id
  main.querySelectorAll('h1[id], h2[id], h3[id]').forEach(h => {
    // remove existing lock if re-injecting
    const existing = h.querySelector('.lock');
    if (existing) existing.remove();

    const span = document.createElement('span');
    span.className = 'lock';
    span.title = 'Copy link to clipboard';
    span.innerText = '🔗';
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = h.id;
      // new URL: keep wiki index path, add page query + fragment to ensure reopening works
      const newUrl = `${window.location.pathname}?page=${encodeURIComponent(currentPage)}#${encodeURIComponent(id)}`;
      history.replaceState(null, '', newUrl);
      // copy
      navigator.clipboard?.writeText(location.href).catch(()=>{/*ignore*/});
      // tiny visual feedback
      span.innerText = '✓';
      setTimeout(()=> span.innerText = '🔗', 900);
    });
    h.appendChild(span);
  });
}

// smooth scroll helper that accounts for fixed header height
function scrollToIdFn(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const headerOffset = document.querySelector('header')?.offsetHeight || 70;
  const rect = el.getBoundingClientRect();
  const absTop = window.scrollY + rect.top;
  window.scrollTo({
    top: absTop - headerOffset - 8,
    behavior: 'smooth'
  });
}

// Create snowflakes (a small number, randomized)
function createSnow() {
  const container = document.querySelector('.snowflakes');
  if (!container) return;
  container.innerHTML = '';
  const count = 10;
  for (let i=0;i<count;i++){
    const div = document.createElement('div');
    div.className = 'snowflake';
    div.textContent = (Math.random() > 0.5) ? '❅' : '❆';
    const left = Math.random() * 100;
    div.style.left = left + 'vw';
    div.style.fontSize = (Math.random() * 12 + 10) + 'px';
    div.style.animationDuration = (Math.random() * 6 + 6) + 's';
    div.style.opacity = (Math.random() * 0.6 + 0.4);
    container.appendChild(div);
  }
}

// set up sidebar links and topbar nav
function wireUI() {
  // sidebar page links
  document.querySelectorAll('.page-link').forEach(a => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const page = a.dataset.page;
      if (!page) return;
      // update visual selection
      document.querySelectorAll('.sidebar-nav a').forEach(x => x.classList.remove('active'));
      a.classList.add('active');

      // update URL search param so it can be reopened later
      const newUrl = `${window.location.pathname}?page=${encodeURIComponent(page)}`;
      history.replaceState(null, '', newUrl);

      loadPage(page);
    });
  });

  // when the user clicks any in-page anchor inside the mainframe, use smooth scroll
  document.addEventListener('click', (ev) => {
    const target = ev.target.closest('a[href^="#"]');
    if (!target) return;
    // let external anchors (like header links) proceed
    ev.preventDefault();
    const id = target.getAttribute('href').slice(1);
    scrollToIdFn(id);
  });
}

// parse initial page from ?page=... and load
function init() {
  createSnow();
  wireUI();

  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get('page') || DEFAULT_PAGE;

  // if the param is present but not same as default, highlight the corresponding sidebar link
  const sidebarLink = document.querySelector(`.page-link[data-page="${pageParam}"]`);
  if (sidebarLink) {
    sidebarLink.classList.add('active');
  }

  // if URL also contains a hash, save it for scrolling after load
  const frag = location.hash ? location.hash.replace('#','') : null;
  loadPage(pageParam, frag);
}

document.addEventListener('DOMContentLoaded', init);
