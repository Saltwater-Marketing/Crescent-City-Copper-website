// Photo viewer (lightbox), site-wide. Opens any link marked data-lb, and any link inside page text that points straight
// at an image. Plain HTML/CSS overlay (no <dialog>), so it works on older phones and browsers.
// Close button, previous/next, photo counter, swipe, keyboard (Esc, arrows), tap outside the photo to close.
// Without JavaScript the links simply open the image.
(function () {
  const IMG = /\.(jpe?g|png|webp|gif)(\?|$)|\/\.netlify\/images\?/i;
  const links = [...document.querySelectorAll('a[data-lb], .prose a[href]')].filter(
    (a) => a.hasAttribute('data-lb') || (IMG.test(a.getAttribute('href')) && a.querySelector('img'))
  );
  if (!links.length) return;

  const box = document.createElement('div');
  box.className = 'lbx';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Photo viewer');
  box.innerHTML =
    '<div class="lbx-stage"><img class="lbx-img" alt=""><div class="lbx-spin" aria-hidden="true"></div></div>' +
    '<div class="lbx-bar"><span class="lbx-count" aria-live="polite"></span><span class="lbx-cap"></span></div>' +
    '<button type="button" class="lbx-btn lbx-close" aria-label="Close photo viewer"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" fill="none"/></svg></button>' +
    '<button type="button" class="lbx-btn lbx-prev" aria-label="Previous photo"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" fill="none"/></svg></button>' +
    '<button type="button" class="lbx-btn lbx-next" aria-label="Next photo"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" fill="none"/></svg></button>';
  document.body.appendChild(box);

  const img = box.querySelector('.lbx-img');
  const count = box.querySelector('.lbx-count');
  const cap = box.querySelector('.lbx-cap');
  const prevBtn = box.querySelector('.lbx-prev');
  const nextBtn = box.querySelector('.lbx-next');
  let group = [];
  let i = 0;
  let opener = null;

  // Photos are grouped: one gallery section, or one page's text
  const groupOf = (a) => {
    const root = a.closest('[data-lb-group], .g-sec, .prose') || document.body;
    return links.filter((x) => (x.closest('[data-lb-group], .g-sec, .prose') || document.body) === root);
  };
  const preload = (n) => { const a = group[(n + group.length) % group.length]; if (a) { const p = new Image(); p.src = a.href; } };

  function show(n) {
    i = (n + group.length) % group.length;
    const a = group[i];
    const thumb = a.querySelector('img');
    box.classList.add('loading');
    img.onload = () => box.classList.remove('loading');
    img.onerror = () => box.classList.remove('loading');
    img.src = a.href;
    img.alt = (thumb && thumb.alt) || '';
    count.textContent = group.length > 1 ? `${i + 1} / ${group.length}` : '';
    cap.textContent = a.getAttribute('data-caption') || '';
    prevBtn.hidden = nextBtn.hidden = group.length < 2;
    preload(i + 1); preload(i - 1);
  }
  function open(a) {
    opener = a;
    group = groupOf(a);
    show(group.indexOf(a));
    box.hidden = false;
    document.documentElement.classList.add('lbx-open');
    box.querySelector('.lbx-close').focus();
  }
  function close() {
    box.hidden = true;
    document.documentElement.classList.remove('lbx-open');
    img.removeAttribute('src');
    if (opener) opener.focus();
  }

  links.forEach((a) => a.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) return; // let people open the image in a new tab on purpose
    e.preventDefault();
    open(a);
  }));
  box.querySelector('.lbx-close').addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(i - 1));
  nextBtn.addEventListener('click', () => show(i + 1));
  // Tap the dark area (not the photo or a button) to close
  box.addEventListener('click', (e) => { if (e.target === box || e.target.classList.contains('lbx-stage')) close(); });
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'Tab') { // keep keyboard focus inside the viewer
      const f = [...box.querySelectorAll('button:not([hidden])')];
      const k = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  // Swipe left/right to change photo, swipe down to close
  let x0 = null, y0 = null;
  box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(i + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
    x0 = y0 = null;
  }, { passive: true });
})();
