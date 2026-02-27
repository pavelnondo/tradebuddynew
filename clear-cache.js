#!/usr/bin/env node

/**
 * Cache Busting Script for TradeBuddy
 * This script helps clear browser cache and service worker cache
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Clearing TradeBuddy cache...');

// Update service worker with new timestamp
const swPath = path.join(__dirname, 'public', 'sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  const timestamp = Date.now();
  swContent = swContent.replace(
    /const CACHE_NAME = `tradebuddy-v1\.0\.\${Date\.now\(\)}`;/,
    `const CACHE_NAME = 'tradebuddy-v1.0.${timestamp}';`
  );
  fs.writeFileSync(swPath, swContent);
  console.log(`✅ Updated service worker cache name: tradebuddy-v1.0.${timestamp}`);
}

// Update package.json version for cache busting
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const versionParts = packageJson.version.split('.');
  const patchVersion = parseInt(versionParts[2]) + 1;
  packageJson.version = `${versionParts[0]}.${versionParts[1]}.${patchVersion}`;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log(`✅ Updated package version: ${packageJson.version}`);
}

console.log('🎯 Cache busting complete! Restart your dev server.');
console.log('💡 If you still see cached content, try:');
console.log('   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)');
console.log('   - Clear browser cache in DevTools');
console.log('   - Disable cache in DevTools Network tab');
