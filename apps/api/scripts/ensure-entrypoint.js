const fs = require('fs');
const path = require('path');

const apiRoot = path.resolve(__dirname, '..');
const apiDist = path.join(apiRoot, 'dist');
const repoRoot = path.resolve(apiRoot, '..', '..');
const roots = [apiDist, path.join(repoRoot, 'dist')];
const visited = new Set();
const matches = [];

function walk(directory) {
  if (!fs.existsSync(directory) || visited.has(directory)) return;
  visited.add(directory);

  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules') walk(fullPath);
      continue;
    }
    if (item.isFile() && item.name === 'main.js') {
      const siblingAppModule = path.join(directory, 'app.module.js');
      if (fs.existsSync(siblingAppModule)) matches.push(fullPath);
    }
  }
}

for (const root of roots) walk(root);

if (matches.length === 0) {
  throw new Error(
    'Nest build completed but no compiled main.js beside app.module.js was found. ' +
    'Searched: ' + roots.join(', ')
  );
}

const preferred = matches.find((file) => path.dirname(file) === apiDist)
  || matches.find((file) => file.startsWith(apiDist + path.sep))
  || matches[0];

fs.mkdirSync(apiDist, { recursive: true });
const relativeTarget = path.relative(apiDist, preferred).split(path.sep).join('/');
const requireTarget = relativeTarget.startsWith('.') ? relativeTarget : './' + relativeTarget;
fs.writeFileSync(
  path.join(apiDist, 'main.js'),
  `require(${JSON.stringify(requireTarget)});\n`,
  'utf8'
);

console.log('Created API entrypoint shim: dist/main.js -> ' + requireTarget);
