// Read-only inventory of the adjacent legacy game; plugin metadata is parsed as literals.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parsePlugins } = require('../../PluginParser.js');
const root = path.resolve(__dirname, '../../../Tales of The Dark Time');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const plugins = parsePlugins(read('js/plugins.js'));
const pluginDir = path.join(root, 'js/plugins');
const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const listed = plugins.map((p, index) => {
  const file = path.join(pluginDir, `${p.name}.js`);
  const exists = fs.existsSync(file);
  const content = exists ? fs.readFileSync(file, 'utf8') : '';
  const yep = [...new Set((content.match(/\bYEP_[A-Za-z0-9_]+\b/g) || []))].sort();
  return { order: index + 1, name: p.name, enabled: p.status === true, fileExists: exists, sha256: exists ? sha(file) : null, yepMentions: yep };
});
const listedNames = new Set(plugins.map(p => `${p.name}.js`.toLowerCase()));
const report = {
  source: 'Tales of The Dark Time',
  pluginsJsSha256: sha(path.join(root, 'js/plugins.js')),
  dataDirectoryPresent: fs.existsSync(path.join(root, 'data')),
  pluginFileCount: files.length,
  listedPluginCount: listed.length,
  enabledPluginCount: listed.filter(p => p.enabled).length,
  plugins: listed,
  unlistedPluginFiles: files.filter(f => !listedNames.has(f.toLowerCase())).sort(),
  note: 'YEP mentions are textual indicators, not verified runtime dependencies. Licenses and ownership are not inferred.'
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
