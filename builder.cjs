const fs = require('fs');
const path = require('path');
module.exports = {
  write: (p, c) => {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, c, 'utf8');
    console.log('WROTE: ' + p);
  }
};
