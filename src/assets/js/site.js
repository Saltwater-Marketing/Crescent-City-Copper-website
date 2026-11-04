// Site-wide: phone menu toggle, and desktop drop-downs (hover opens them via CSS; this adds click, keyboard and Escape).
(function () {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('mobile-nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Close' : 'Menu';
    });
  }
  const items = [...document.querySelectorAll('.mm-item.has-panel')];
  const close = li => { li.classList.remove('open'); li.querySelector('.mm-toggle').setAttribute('aria-expanded', 'false'); };
  items.forEach(li => {
    const t = li.querySelector('.mm-toggle');
    t.addEventListener('click', () => {
      const opening = !li.classList.contains('open');
      items.forEach(close);
      li.classList.remove('shut');
      if (opening) { li.classList.add('open'); t.setAttribute('aria-expanded', 'true'); } else li.classList.add('shut');
    });
    li.addEventListener('mouseleave', () => li.classList.remove('shut'));
    li.addEventListener('focusout', e => { if (!li.contains(e.relatedTarget)) { close(li); li.classList.remove('shut'); } });
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const li = items.find(x => x.contains(document.activeElement) || x.classList.contains('open'));
    if (!li) return;
    close(li); li.classList.add('shut'); li.querySelector('.mm-toggle').focus();
  });
  document.addEventListener('click', e => items.forEach(li => { if (!li.contains(e.target)) close(li); }));
})();
