const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../messages');
const files = ['zh-TW.json', 'en.json', 'ja.json', 'zh-CN.json'];

// Helper to flatten object
function flattenObj(obj, parent = '', res = {}) {
  for (let key in obj) {
    let propName = parent ? parent + '.' + key : key;
    if (typeof obj[key] == 'object' && obj[key] !== null) {
      flattenObj(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}

const locales = {};

// Load and flatten
files.forEach(file => {
  if (fs.existsSync(path.join(messagesDir, file))) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(messagesDir, file), 'utf8'));
      locales[file.replace('.json', '')] = Object.keys(flattenObj(content));
    } catch (e) {
      console.error(`Error reading ${file}:`, e);
    }
  }
});

// Find the union of all keys
const allKeys = new Set();
Object.values(locales).forEach(keys => keys.forEach(k => allKeys.add(k)));

console.log(`Total unique keys across all language files: ${allKeys.size}`);

const report = {};

allKeys.forEach(key => {
  let missingIn = [];
  for (let locale in locales) {
    if (!locales[locale].includes(key)) {
      missingIn.push(locale);
    }
  }
  if (missingIn.length > 0) {
    report[key] = missingIn;
  }
});

if (Object.keys(report).length === 0) {
  console.log('✅ All translation keys are perfectly synced across all language files!');
} else {
  console.log('❌ Found missing keys across languages:');
  for (let key in report) {
    console.log(`- "${key}" is missing in: ${report[key].join(', ')}`);
  }
}
