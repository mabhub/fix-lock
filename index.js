#!/usr/bin/env node

const fsLegacy = require('fs');
const fs = require('fs').promises;
const libnpm = require('libnpm');

const traverseLock = require('./lib/traverse-lock.js');

(async () => {
  const [,, file] = process.argv;

  if (!file || !fsLegacy.existsSync(file)) {
    process.exit(1);
  }

  const fileBuffer = await fs.readFile(file);
  const fileString = fileBuffer.toString();
  const depsTree = JSON.parse(fileString);

  const { hashMap, missings } = traverseLock(depsTree);

  if (!missings.length) {
    console.log('No package found without resolved path.');
    process.exit(0);
  }

  console.log(`Packages found without resolved path: ${missings.length}`)

  const fixes = { local: 0, remote: 0 };

  for (const { package, packageName } of missings) {
    const { integrity, version } = package;

    const path = hashMap[integrity]
    // path found in hashmap
    if (path) {
      package.resolved = path;
      fixes.local++;
      continue;
    }

    // not found in hashmap, query npm api
    const { _resolved, _integrity } = await libnpm.manifest(`${packageName}@${version}`);
    if (_integrity === integrity && _resolved) {
      package.resolved = _resolved;
      fixes.remote++;
    }
  }

  console.log(`Packages fixed locally: ${fixes.local}`)
  console.log(`Packages fixed through npm API: ${fixes.remote}`)

  const output = JSON.stringify(depsTree, null, 2) + '\n';
  await fs.writeFile(file, output);
})();
