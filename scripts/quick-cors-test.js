#!/usr/bin/env node

/**
 * Quick CORS Test for Railway Deployment
 * Usage: node scripts/quick-cors-test.js
 */

const https = require('https');
const http = require('http');

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function testCORS() {
  const API_URL = 'https://hvh-api-production.up.railway.app';
  const ORIGIN = 'https://hvh-web.vercel.app';
  
  console.log('🧪 Testing CORS for Railway deployment...');
  console.log(`📡 API: ${API_URL}`);
  console.log(`🌐 Origin: ${ORIGIN}\n`);

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await makeRequest(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Origin': ORIGIN,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${healthResponse.statusCode}`);
    console.log(`   CORS Origin: ${healthResponse.headers['access-control-allow-origin'] || 'NOT SET'}`);
    console.log(`   CORS Credentials: ${healthResponse.headers['access-control-allow-credentials'] || 'NOT SET'}`);
    
    if (healthResponse.statusCode === 200) {
      console.log(`   ✅ Health check passed`);
    } else {
      console.log(`   ❌ Health check failed`);
    }

    // Test 2: Preflight request
    console.log('\n2️⃣ Testing preflight OPTIONS request...');
    const preflightResponse = await makeRequest(`${API_URL}/api/v1/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log(`   Status: ${preflightResponse.statusCode}`);
    console.log(`   CORS Origin: ${preflightResponse.headers['access-control-allow-origin'] || 'NOT SET'}`);
    console.log(`   CORS Methods: ${preflightResponse.headers['access-control-allow-methods'] || 'NOT SET'}`);
    console.log(`   CORS Headers: ${preflightResponse.headers['access-control-allow-headers'] || 'NOT SET'}`);
    
    if (preflightResponse.headers['access-control-allow-origin']) {
      console.log(`   ✅ Preflight passed`);
    } else {
      console.log(`   ❌ Preflight failed - No CORS headers`);
    }

    console.log('\n📋 Summary:');
    if (healthResponse.headers['access-control-allow-origin'] && 
        preflightResponse.headers['access-control-allow-origin']) {
      console.log('✅ CORS is working correctly!');
    } else {
      console.log('❌ CORS is not working. Check:');
      console.log('   1. ALLOWED_ORIGINS environment variable in Railway');
      console.log('   2. Server logs in Railway dashboard');
      console.log('   3. Make sure server is actually running');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Possible issues:');
    console.log('   1. Server is not running');
    console.log('   2. Wrong Railway URL');
    console.log('   3. Network connectivity issues');
  }
}

testCORS();
