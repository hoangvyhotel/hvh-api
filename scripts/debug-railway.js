#!/usr/bin/env node

/**
 * Debug Railway Deployment
 */

const https = require('https');

async function checkRailwayUrls() {
  const possibleUrls = [
    'https://hvh-api-qa.up.railway.app',
    'https://hvh-api.up.railway.app',
    'https://hvh-api-production.up.railway.app'
  ];

  console.log('🔍 Checking possible Railway URLs...\n');

  for (const url of possibleUrls) {
    try {
      console.log(`Testing: ${url}`);
      
      const response = await new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'GET' }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
        req.end();
      });

      console.log(`   Status: ${response.statusCode}`);
      if (response.statusCode === 200) {
        console.log(`   ✅ Working! Data: ${response.data.substring(0, 100)}...`);
      } else if (response.statusCode === 404) {
        console.log(`   ❌ 404 - Server running but route not found`);
      } else {
        console.log(`   ⚠️  Unexpected status: ${response.statusCode}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('🔧 If all URLs return 404, check:');
  console.log('   1. Railway deployment logs');
  console.log('   2. Make sure the build succeeded');
  console.log('   3. Check if PORT environment variable is set correctly');
  console.log('   4. Verify the start command in package.json');
}

checkRailwayUrls();
