// Collection page: profile filter chips and sort. Without JavaScript every product simply shows in series order.
(function () {
  const grid = document.querySelector('[data-js="grid"]');
  if (!grid) return;
  const items = Array.from(grid.children);
  const chips = Array.from(document.querySelectorAll('.chip[data-profile]'));
  const sort = document.querySelector('[data-js="sort"]');

  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    const want = chip.dataset.profile;
    items.forEach(li => { li.hidden = !!want && li.dataset.profile !== want; });
  }));

  if (sort) sort.addEventListener('change', () => {
    const k = sort.value;
    const by = { order: (a, b) => a.dataset.order - b.dataset.order, low: (a, b) => a.dataset.price - b.dataset.price, high: (a, b) => b.dataset.price - a.dataset.price }[k];
    items.slice().sort(by).forEach(li => grid.appendChild(li));
  });
})();
