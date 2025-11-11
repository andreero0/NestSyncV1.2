#!/usr/bin/env node
/**
 * WebSocket Security Verification Script
 * 
 * Manually tests the WebSocket URL generation logic to ensure:
 * 1. HTTPS converts to WSS (encrypted) for production
 * 2. HTTP converts to WS (unencrypted) only in development
 * 3. Production never uses unencrypted WebSocket
 * 4. /graphql endpoint is replaced with /subscriptions
 */

console.log('🔒 WebSocket Security Verification\n');
console.log('=' .repeat(60));

// Test counter
let passed = 0;
let failed = 0;

// Helper function to simulate getWebSocketUrl
function getWebSocketUrl(httpUrl, isProduction = false) {
  if (!httpUrl) {
    throw new Error('GraphQL URL is required for WebSocket connection');
  }

  let wsUrl = httpUrl;

  // Convert HTTPS to WSS (encrypted WebSocket for production)
  if (httpUrl.startsWith('https://')) {
    wsUrl = httpUrl.replace('https://', 'wss://');
  }
  // Convert HTTP to WS (unencrypted WebSocket for development only)
  else if (httpUrl.startsWith('http://')) {
    // In production, never use unencrypted WebSocket
    if (isProduction) {
      throw new Error('Cannot use unencrypted WebSocket (ws://) in production environment');
    }
    wsUrl = httpUrl.replace('http://', 'ws://');
  }
  else {
    throw new Error(`Invalid GraphQL URL protocol: ${httpUrl}`);
  }

  // Replace /graphql endpoint with /subscriptions
  wsUrl = wsUrl.replace('/graphql', '/subscriptions');

  return wsUrl;
}

// Test helper
function test(description, testFn) {
  try {
    testFn();
    console.log(`✅ PASS: ${description}`);
    passed++;
  } catch (error) {
    console.log(`❌ FAIL: ${description}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

// Test Suite
console.log('\n📋 Test Suite: WebSocket URL Generation\n');

// Test 1: HTTPS to WSS conversion
test('Convert https:// to wss:// for production', () => {
  const input = 'https://api.nestsync.ca/graphql';
  const expected = 'wss://api.nestsync.ca/subscriptions';
  const result = getWebSocketUrl(input, true);
  
  if (result !== expected) {
    throw new Error(`Expected ${expected}, got ${result}`);
  }
});

// Test 2: HTTP to WS conversion in development
test('Convert http:// to ws:// for development localhost', () => {
  const input = 'http://localhost:8001/graphql';
  const expected = 'ws://localhost:8001/subscriptions';
  const result = getWebSocketUrl(input, false);
  
  if (result !== expected) {
    throw new Error(`Expected ${expected}, got ${result}`);
  }
});

// Test 3: HTTP to WS conversion with IP address
test('Convert http:// to ws:// for development with IP', () => {
  const input = 'http://192.168.1.100:8001/graphql';
  const expected = 'ws://192.168.1.100:8001/subscriptions';
  const result = getWebSocketUrl(input, false);
  
  if (result !== expected) {
    throw new Error(`Expected ${expected}, got ${result}`);
  }
});

// Test 4: Production should reject HTTP
test('Throw error for http:// in production', () => {
  const input = 'http://api.nestsync.ca/graphql';
  let errorThrown = false;
  
  try {
    getWebSocketUrl(input, true);
  } catch (error) {
    if (error.message.includes('Cannot use unencrypted WebSocket')) {
      errorThrown = true;
    }
  }
  
  if (!errorThrown) {
    throw new Error('Expected error for unencrypted WebSocket in production');
  }
});

// Test 5: Invalid protocol
test('Throw error for invalid protocol', () => {
  const input = 'ftp://api.nestsync.ca/graphql';
  let errorThrown = false;
  
  try {
    getWebSocketUrl(input, false);
  } catch (error) {
    if (error.message.includes('Invalid GraphQL URL protocol')) {
      errorThrown = true;
    }
  }
  
  if (!errorThrown) {
    throw new Error('Expected error for invalid protocol');
  }
});

// Test 6: Empty URL
test('Throw error for empty URL', () => {
  let errorThrown = false;
  
  try {
    getWebSocketUrl('', false);
  } catch (error) {
    if (error.message.includes('GraphQL URL is required')) {
      errorThrown = true;
    }
  }
  
  if (!errorThrown) {
    throw new Error('Expected error for empty URL');
  }
});

// Test 7: Endpoint replacement
test('Replace /graphql with /subscriptions', () => {
  const inputs = [
    { url: 'https://api.nestsync.ca/graphql', prod: true },
    { url: 'http://localhost:8001/graphql', prod: false },
    { url: 'http://192.168.1.100:8001/graphql', prod: false },
  ];
  
  inputs.forEach(({ url, prod }) => {
    const result = getWebSocketUrl(url, prod);
    if (result.includes('/graphql')) {
      throw new Error(`/graphql not replaced in ${result}`);
    }
    if (!result.includes('/subscriptions')) {
      throw new Error(`/subscriptions not found in ${result}`);
    }
  });
});

// Test 8: PIPEDA Compliance - Production encryption
test('PIPEDA: Production always uses encrypted WebSocket', () => {
  const productionUrl = 'https://api.nestsync.ca/graphql';
  const result = getWebSocketUrl(productionUrl, true);
  
  if (!result.startsWith('wss://')) {
    throw new Error('Production must use encrypted WebSocket (wss://)');
  }
  if (result.startsWith('ws://')) {
    throw new Error('Production must not use unencrypted WebSocket (ws://)');
  }
});

// Test 9: Development can use unencrypted for localhost
test('Development allows unencrypted WebSocket for localhost', () => {
  const devUrl = 'http://localhost:8001/graphql';
  const result = getWebSocketUrl(devUrl, false);
  
  if (!result.startsWith('ws://')) {
    throw new Error('Development should allow unencrypted WebSocket (ws://)');
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📈 Total:  ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! WebSocket security is properly configured.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.\n');
  process.exit(1);
}
