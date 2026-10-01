const fs = require('fs');
const path = require('path');
module.exports = function(filePath, content) {
  const fullPath = path.resolve(filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, { encoding: 'utf8', flag: 'w' });
  console.log('Saved: ' + filePath);
};
