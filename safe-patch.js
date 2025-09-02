const fs = require('fs');

// Path to the deployed JavaScript file
const jsFilePath = '/var/www/mytradebuddy.ru/assets/index-Bfj6r2Pt.js';

console.log('Reading JavaScript file...');
let content = fs.readFileSync(jsFilePath, 'utf8');

console.log('Applying safe patches...');

// Patch 1: Find and replace specific trades.slice patterns more carefully
// Look for the exact pattern that's causing the error
let patchCount = 0;

// Find the specific line that has trades.slice(0,5).map
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Look for trades.slice(0,5).map pattern
  if (line.includes('trades.slice(0,5).map(')) {
    console.log(`Found trades.slice pattern at line ${i + 1}`);
    lines[i] = line.replace(
      'trades.slice(0,5).map(',
      '(trades && Array.isArray(trades) ? trades : []).slice(0,5).map('
    );
    patchCount++;
  }
  
  // Look for other trades.map patterns
  if (line.includes('trades.map(') && !line.includes('Array.isArray')) {
    console.log(`Found trades.map pattern at line ${i + 1}`);
    lines[i] = line.replace(
      'trades.map(',
      '(trades && Array.isArray(trades) ? trades : []).map('
    );
    patchCount++;
  }
}

// Rejoin the content
content = lines.join('\n');

console.log(`Applied ${patchCount} patches`);
console.log('Writing patched file...');
fs.writeFileSync(jsFilePath, content, 'utf8');

console.log('✅ JavaScript file patched safely!');
console.log(`Added ${patchCount} safety checks for trades.map calls`);
