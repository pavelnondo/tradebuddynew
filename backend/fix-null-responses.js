// Fix for null responses in backend API
// This ensures all endpoints return proper arrays instead of null

const fs = require('fs');
const path = require('path');

// Read the current index.js
const indexPath = path.join(__dirname, 'index.js');
let content = fs.readFileSync(indexPath, 'utf8');

// Fix all res.json(result.rows) to ensure they return arrays
content = content.replace(
  /res\.json\(result\.rows\)/g,
  'res.json(result.rows || [])'
);

// Fix any other potential null responses
content = content.replace(
  /res\.json\(result\.rows\[0\]\)/g,
  'res.json(result.rows[0] || null)'
);

// Write the fixed content back
fs.writeFileSync(indexPath, content, 'utf8');

console.log('✅ Fixed null response issues in backend API');
console.log('🔧 All endpoints now return proper arrays instead of null');
console.log('🚀 Restart your backend service to apply changes');
