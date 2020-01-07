const traverseLock = obj => {
  let hashMap = {};
  const missings = [];

  for (const key in obj) {
    if (!!obj[key] && typeof obj[key] === "object") {
      const currentDep = obj[key]
      const { integrity: hash, resolved: path } = currentDep;

      if (!hashMap[hash] && hash && path) {
        hashMap[hash] = path;
      }

      if (hash && !path) {
        missings.push({
          packageName: key,
          package: currentDep,
        });
      }

      const {
        hashMap: subHashMap,
        missings: subMissings,
      } = traverseLock(currentDep);

      missings.push(...subMissings);
      hashMap = { ...hashMap, ...subHashMap };
    }
  }

  return { hashMap, missings };
};

module.exports = traverseLock;
