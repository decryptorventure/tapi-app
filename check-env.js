#!/usr/bin/env node

/**
 * Diagnostic script to check .env.local file
 * Run: node check-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('=== .env.local File Check ===\n');

const envPath = path.join(__dirname, '.env.local');

try {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  const vars = {};
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key) {
      vars[key.trim()] = valueParts.join('=').trim();
    }
  });

  console.log('Found variables:');
  Object.keys(vars).forEach(key => {
    const value = vars[key];
    const preview = value ? value.substring(0, 20) + '...' : '(empty)';
    console.log(`  ${key} = ${preview}`);
  });

  console.log('\n=== Validation ===\n');

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  let allOk = true;

  requiredVars.forEach(varName => {
    const value = vars[varName];
    const exists = varName in vars;
    const hasValue = value && value.length > 0;
    const isPlaceholder = value && (
      value.includes('your-') ||
      value.includes('xxx') ||
      value === 'undefined' ||
      value.includes('placeholder')
    );

    console.log(`${varName}:`);
    console.log(`  ${exists ? '✅' : '❌'} Variable exists`);
    console.log(`  ${hasValue ? '✅' : '❌'} Has value`);
    console.log(`  ${!isPlaceholder ? '✅' : '❌'} Not a placeholder`);

    if (!exists || !hasValue || isPlaceholder) {
      allOk = false;
    }
    console.log('');
  });

  console.log('=================================');
  if (allOk) {
    console.log('✅ Configuration looks good!');
    console.log('\nIf you still see errors, restart the dev server:');
    console.log('  npm run dev');
  } else {
    console.log('❌ Issues found in .env.local\n');
    console.log('Expected format:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...');
    console.log('\nMake sure:');
    console.log('  • No spaces around =');
    console.log('  • No quotes around values');
    console.log('  • Actual values (not placeholders)');
  }

} catch (error) {
  console.error('❌ Error reading .env.local:', error.message);
  console.log('\nMake sure .env.local file exists in project root.');
}
