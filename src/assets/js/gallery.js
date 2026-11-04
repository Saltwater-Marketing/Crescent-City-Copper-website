// Project Gallery: big photo viewer above the groups, previous/next, filter chips.
// Without JavaScript the viewer stays hidden and each thumbnail opens its full-size photo.
(function () {
  const viewer = document.getElementById('viewer');
  if (!viewer) return;
  const thumbs = Array.from(document.querySelectorAll('.g-thumb'));
  const groups = Array.from(document.querySelectorAll('.g-group'));
  const chips = Array.from(document.querySelectorAll('.chip[data-kind]'));
  const $ = s => viewer.querySelector(s);
  const img = $('[data-js="v-img"]'), title = $('[data-js="v-title"]'), count = $('[data-js="v-count"]'), shop = $('[data-js="v-shop"]');
  let list = thumbs, i = 0;

  function show(n) {
    i = (n + list.length) % list.length;
    const t = list[i];
    img.src = t.dataset.full;
    img.alt = t.querySelector('img').alt;
    title.textContent = t.dataset.title;
    count.textContent = (i + 1) + ' of ' + list.length;
    shop.hidden = !t.dataset.shop;
    if (t.dataset.shop) { shop.href = t.dataset.shop; shop.textContent = t.dataset.shopLabel; }
    thumbs.forEach(x => x.removeAttribute('aria-current'));
    t.setAttribute('aria-current', 'true');
  }
  viewer.hidden = false;
  show(0);
  $('[data-js="v-prev"]').addEventListener('click', () => show(i - 1));
  $('[data-js="v-next"]').addEventListener('click', () => show(i + 1));
  viewer.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
  thumbs.forEach(t => t.addEventListener('click', e => {
    e.preventDefault();
    show(list.indexOf(t));
    viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    const k = chip.dataset.kind;
    groups.forEach(g => { g.hidden = !!k && g.dataset.kind !== k; });
    list = thumbs.filter(t => !t.closest('.g-group').hidden);
    show(0);
  }));
})();
