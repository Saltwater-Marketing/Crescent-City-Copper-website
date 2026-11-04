// Build-time settings (Netlify environment variables).
//  SHOP_URL   where cart, checkout and My Account live (WooCommerce). Until launch: the live site.
//             At launch: https://shop.crescentcitycopper.com
//  SITE_LIVE  "true" ONLY at launch: turns on GA4 + Meta Pixel and lets Google index the site. Without it every build
//             (including the netlify.app preview) is hidden from search engines and sends no tracking.
const { BASE } = require('../../lib/woo.js');
const live = process.env.SITE_LIVE === 'true';
module.exports = {
  shopUrl: (process.env.SHOP_URL || BASE).replace(/\/$/, ''),
  isProduction: live,
  // Address used in canonical / share links. Before launch it's the Netlify preview's own address, so a shared link
  // never points at the old WordPress pages. At launch: the bare domain (CLAUDE.md decision 5).
  siteUrl: (live ? 'https://crescentcitycopper.com' : (process.env.URL || 'https://crescentcitycopper.com')).replace(/\/$/, ''),
  year: new Date().getFullYear(),
};
