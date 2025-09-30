#!/usr/bin/env node

/**
 * Simple health check utility for NestSync development servers
 * Works with your existing manual development approach
 *
 * Usage: node scripts/dev-health-check.js
 * Or: npm run health-check (if you add it to package.json)
 */

const http = require('http');

const SERVERS = {
  backend: { port: 8001, path: '/graphql', name: 'Backend (FastAPI)' },
  frontend: { port: 8082, path: '/', name: 'Frontend (Expo)' },
};

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function checkServer(name, host, port, path) {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'HEAD',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      resolve({
        name,
        status: 'online',
        code: res.statusCode,
        message: `${COLORS.green}✓ Online${COLORS.reset} (${res.statusCode})`
      });
    });

    req.on('error', (err) => {
      resolve({
        name,
        status: 'offline',
        code: null,
        message: `${COLORS.red}✗ Offline${COLORS.reset} - ${err.message}`
      });
    });

    req.on('timeout', () => {
      resolve({
        name,
        status: 'timeout',
        code: null,
        message: `${COLORS.yellow}⚠ Timeout${COLORS.reset} - No response after 3s`
      });
    });

    req.setTimeout(3000);
    req.end();
  });
}

async function performHealthCheck() {
  console.log(`${COLORS.blue}NestSync Development Server Health Check${COLORS.reset}`);
  console.log('=' .repeat(45));

  const results = [];

  for (const [key, config] of Object.entries(SERVERS)) {
    console.log(`Checking ${config.name}...`);
    const result = await checkServer(config.name, 'localhost', config.port, config.path);
    results.push(result);
    console.log(`  ${result.message}`);
  }

  console.log('\n' + '=' .repeat(45));

  const onlineCount = results.filter(r => r.status === 'online').length;
  const totalCount = results.length;

  if (onlineCount === totalCount) {
    console.log(`${COLORS.green}✓ All servers are online and ready for Playwright testing${COLORS.reset}`);
    process.exit(0);
  } else {
    console.log(`${COLORS.yellow}⚠ ${onlineCount}/${totalCount} servers online${COLORS.reset}`);
    console.log('\nTo start your development servers manually:');
    console.log('Backend:  cd NestSync-backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8001 --reload');
    console.log('Frontend: cd NestSync-frontend && npx expo start --port 8082 --clear');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  performHealthCheck().catch(console.error);
}

module.exports = { performHealthCheck, checkServer };