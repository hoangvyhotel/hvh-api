#!/usr/bin/env node

/**
 * CORS Testing Script
 * Usage: node scripts/test-cors.js <api-url> <origin>
 */

const fetch = require('node-fetch');

async function testCORS(apiUrl, origin) {
  console.log(`🧪 Testing CORS for API: ${apiUrl}`);
  console.log(`🌐 From Origin: ${origin}\n`);

  try {
    // Test 1: Simple GET request
    console.log('1️⃣ Testing simple GET request...');
    const response1 = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Origin': origin,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response1.status}`);
    console.log(`   CORS Headers:`);
    console.log(`   - Access-Control-Allow-Origin: ${response1.headers.get('access-control-allow-origin')}`);
    console.log(`   - Access-Control-Allow-Credentials: ${response1.headers.get('access-control-allow-credentials')}`);
    
    // Test 2: Preflight request
    console.log('\n2️⃣ Testing preflight OPTIONS request...');
    const response2 = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log(`   Status: ${response2.status}`);
    console.log(`   CORS Headers:`);
    console.log(`   - Access-Control-Allow-Origin: ${response2.headers.get('access-control-allow-origin')}`);
    console.log(`   - Access-Control-Allow-Methods: ${response2.headers.get('access-control-allow-methods')}`);
    console.log(`   - Access-Control-Allow-Headers: ${response2.headers.get('access-control-allow-headers')}`);
    console.log(`   - Access-Control-Allow-Credentials: ${response2.headers.get('access-control-allow-credentials')}`);

    console.log('\n✅ CORS test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ CORS test failed:', error.message);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/test-cors.js <api-url> <origin>');
  console.log('Example: node scripts/test-cors.js https://your-app.railway.app https://hvh-web.vercel.app');
  process.exit(1);
}

const [apiUrl, origin] = args;
testCORS(apiUrl, origin);
