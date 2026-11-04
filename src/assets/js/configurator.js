// Product options: live total, summary line, front-elevation drawing, quantity and "please choose" checks.
// The form itself posts straight to the WooCommerce cart with the exact Product Add-ons field names (CLAUDE.md
// decision 3), so Add to cart works even if this script fails to load. This script only improves the experience.
(function () {
  const form = document.getElementById('buy');
  if (!form) return;
  const cfg = JSON.parse(form.dataset.config);
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const money = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const qty = $('#qty');
  const steps = $$('fieldset.step', form);

  // Nothing is pre-selected (same rule as Flambeaux): the customer makes every choice, so nobody orders a default they
  // didn't mean. Steps with a single choice are already ticked in the HTML. Browsers can restore old choices on Back,
  // so clear multi-choice steps on load too.
  for (const fs of steps) { const r = $$('input[type="radio"]', fs); if (r.length > 1) r.forEach(i => { i.checked = false; }); }
  const title = fs => $('legend', fs).childNodes[1].textContent.trim();
  const missing = () => steps.filter(fs => fs.hasAttribute('data-required') && !$('input:checked', fs));

  function render() {
    let unit = cfg.base;
    const parts = [];
    for (const fs of steps) {
      const c = $('input:checked', fs);
      for (const l of $$('.opt', fs)) l.classList.toggle('on', !!$('input:checked', l));
      if (!c) continue;
      unit += Number(c.dataset.price || 0);
      parts.push(c.closest('.opt').querySelector('.opt-name').firstChild.textContent.trim() + (fs.dataset.step === 'bracket' ? ' brackets' : ''));
    }
    const q = Math.max(1, Math.min(99, parseInt(qty.value, 10) || 1));
    const left = missing();
    const from = left.length && steps.length ? 'from ' : '';
    $('[data-js="summary"]').textContent = left.length
      ? (parts.length ? parts.join(' · ') + ' · ' : '') + 'Still to choose: ' + left.map(title).join(', ')
      : parts.concat(money(unit) + ' each').join(' · ');
    $('[data-js="total"]').textContent = from + money(unit * q);
    const mt = $('[data-js="m-total"]'); if (mt) mt.textContent = from + money(unit * q);
    const err = $('[data-js="error"]');
    if (!left.length) err.hidden = true;

    // Drawing: show once a size with width and height is chosen
    const dw = $('[data-js="drawing"]');
    const size = $('fieldset[data-step="size"] input:checked', form);
    if (dw) {
      const ok = size && size.dataset.w;
      dw.hidden = !ok;
      if (ok) {
        $('[data-js="dw-w"]').textContent = size.dataset.w + ' in wide';
        $('[data-js="dw-h"]').textContent = size.dataset.h + ' in high';
        $('[data-js="dw-label"]').textContent = `Drawing of the awning, ${size.dataset.w} inches wide by ${size.dataset.h} inches high`;
      }
    }
  }

  form.addEventListener('change', render);
  $('[data-js="qty-down"]').addEventListener('click', () => { qty.value = Math.max(1, (parseInt(qty.value, 10) || 1) - 1); render(); });
  $('[data-js="qty-up"]').addEventListener('click', () => { qty.value = Math.min(99, (parseInt(qty.value, 10) || 1) + 1); render(); });
  qty.addEventListener('input', render);

  form.addEventListener('submit', e => {
    const left = missing();
    const err = $('[data-js="error"]');
    if (left.length) {
      e.preventDefault();
      err.textContent = 'Please choose your ' + left.map(t => title(t).toLowerCase()).join(' and ') + ' before adding to cart.';
      err.hidden = false;
      left[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      const first = $('input', left[0]); if (first) first.focus({ preventScroll: true });
      return;
    }
    err.hidden = true;
    if (window.gtag) window.gtag('event', 'add_to_cart', { currency: 'USD', items: [{ item_id: String(cfg.id) }] });
    if (window.fbq) window.fbq('track', 'AddToCart');
  });

  render();
})();
