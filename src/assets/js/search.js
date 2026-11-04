// Search page: loads /search-index.json and matches every word of the query against titles and summaries.
(function () {
  const input = document.getElementById('q');
  const out = document.querySelector('[data-js="results"]');
  const count = document.querySelector('[data-js="count"]');
  if (!input || !out) return;
  const q0 = new URLSearchParams(location.search).get('q') || '';
  input.value = q0;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  fetch('/search-index.json').then(r => r.json()).then(items => {
    function run() {
      const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      if (!words.length) { out.innerHTML = ''; count.textContent = ''; return; }
      const hits = items.map(it => {
        const t = it.t.toLowerCase(), s = (it.s || '').toLowerCase();
        if (!words.every(w => t.includes(w) || s.includes(w))) return null;
        return { it, score: words.filter(w => t.includes(w)).length * 3 + (it.k === 'Product' ? 2 : it.k === 'Category' ? 3 : 0) };
      }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 40);
      count.textContent = hits.length ? `${hits.length} result${hits.length > 1 ? 's' : ''}` : 'No results. Try fewer words, or call us at 1-877-251-5327.';
      out.innerHTML = hits.map(({ it }) => `<li><a href="${it.u}"><span class="kicker">${esc(it.k)}</span><strong>${esc(it.t)}</strong><span>${esc(it.s || '')}</span></a></li>`).join('');
    }
    input.addEventListener('input', run);
    run();
  });
})();
