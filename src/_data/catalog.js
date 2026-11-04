const { loadRaw } = require('../../lib/woo.js');
const { build } = require('../../lib/catalog.js');
module.exports = async () => build(await loadRaw());
