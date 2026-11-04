// Option label clean-up, done in the build only (CLAUDE.md decision 7). Nothing changes in WordPress.
// LABELS ONLY: prices, option values and form field names are never touched, so the cart receives exactly what the
// live product page would send.

// Option group titles as WordPress has them -> the step title the product page shows
const GROUP = [
  [/^size\s*\(?\s*diameter/i, { key: 'size', title: 'Size', hint: 'diameter, inches' }],
  [/^size/i, { key: 'size', title: 'Size', hint: null }],
  [/^bracket/i, { key: 'bracket', title: 'Bracket style', hint: 'included, no extra charge' }],
  [/^downspout shape/i, { key: 'shape', title: 'Downspout shape', hint: null }],
];

function group(label, options) {
  const hit = GROUP.find(([re]) => re.test(label));
  const g = hit ? { ...hit[1] } : { key: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title: label.replace(/[(:]+$/, '').trim(), hint: null };
  if (g.key === 'size' && !g.hint) {
    // Awning sizes are width × height (× depth); other sizes are plain inches
    const sample = options.map(o => o.label).join(' ');
    if (/\(small\)|\(medium\)/i.test(sample)) g.hint = 'fits a chimney up to width × length × height, inches';
    else if (/\d\s*w/i.test(sample) && /\d\s*d\b/i.test(sample) && /\d\s*h/i.test(sample)) g.hint = 'width × height × depth, inches';
    else if (/\d\s*w/i.test(sample) && /\d\s*d\b/i.test(sample)) g.hint = 'width × depth, inches';
    else if (/\d\s*w/i.test(sample) && /\d\s*h/i.test(sample)) g.hint = 'width × height, inches';
    else g.hint = 'inches';
  }
  return g;
}

// One option label -> { label, detail }
function option(raw) {
  let s = String(raw).trim()
    .replace(/\s+ADD(\s+\d+)?\s*$/i, '')      // "60wX24h ADD", "72W x 30H ADD 425": old price notes typed into the label
    .replace(/\s*\+\s*$/, '')                  // "5 +"
    .trim();
  // Chimney cap sizes: "(Medium) up to 24W x 34L x 24H" -> Medium / up to 24w × 34l × 24h
  const cap = s.match(/^\((small|medium|large|x-large)\)\s*(.*)$/i);
  if (cap) return { label: cap[1].replace(/^x-l/i, 'X-L').replace(/^./, c => c.toUpperCase()), detail: dims(cap[2]) };
  return { label: dims(s), detail: null };
}

// "48wX24hX18d" / "48W x 30H" / "24X12X2" / "3X4" -> "48w × 24h × 18d" / "48w × 30h" / "24 × 12 × 2" / "3 × 4"
function dims(s) {
  if (!/\dX|\dx|\d\s*[xX]\s*\d|\d[wWhHdDlL]\s*[xX]/.test(s)) return s;
  return s.split(/\s*[xX×]\s*(?=\d)/).map(p => p.trim().replace(/(\d)\s*([wWhHdDlL])$/, (m, n, u) => n + u.toLowerCase())).join(' × ');
}

// Width and height in inches from a size label (for the front-elevation drawing), or null
function wh(label) {
  const w = (label.match(/(\d+(?:\.\d+)?)\s*w/i) || [])[1];
  const h = (label.match(/(\d+(?:\.\d+)?)\s*h/i) || [])[1];
  return w && h ? { w: Number(w), h: Number(h) } : null;
}

module.exports = { group, option, dims, wh };
