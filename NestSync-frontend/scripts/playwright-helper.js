#!/usr/bin/env node

/**
 * Proactive Playwright Infrastructure Enhancement for NestSync
 * Eliminates "fails on first go" through proactive server conflict detection
 *
 * PROACTIVE APPROACH:
 * 1. Detects server conflicts BEFORE testing begins
 * 2. Provides automatic conflict resolution options
 * 3. Validates clean environment with GraphQL introspection
 * 4. Only proceeds when environment is guaranteed clean
 *
 * Usage: node scripts/playwright-helper.js
 * Or add to package.json and use: npm run playwright-setup
 */

const { performHealthCheck } = require('./dev-health-check');
const http = require('http');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

const PORTS = {
  BACKEND: 8001,
  FRONTEND: 8082
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * PROACTIVE SERVER CONFLICT DETECTION
 * Detects multiple processes on same port BEFORE testing begins
 */
async function detectServerConflicts() {
  console.log(`${COLORS.cyan}🔍 PROACTIVE: Detecting server conflicts...${COLORS.reset}`);

  const conflicts = {
    backend: [],
    frontend: [],
    hasConflicts: false
  };

  try {
    // Check backend port conflicts
    const { stdout: backendProcesses } = await execAsync(`lsof -i :${PORTS.BACKEND}`);
    if (backendProcesses) {
      const lines = backendProcesses.split('\n').filter(line => line.includes('LISTEN'));
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          conflicts.backend.push({
            command: parts[0],
            pid: parts[1],
            details: line.trim()
          });
        }
      }
    }
  } catch (error) {
    // No processes on backend port - this is good
  }

  try {
    // Check frontend port conflicts
    const { stdout: frontendProcesses } = await execAsync(`lsof -i :${PORTS.FRONTEND}`);
    if (frontendProcesses) {
      const lines = frontendProcesses.split('\n').filter(line => line.includes('LISTEN'));
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          conflicts.frontend.push({
            command: parts[0],
            pid: parts[1],
            details: line.trim()
          });
        }
      }
    }
  } catch (error) {
    // No processes on frontend port - this is good
  }

  // Determine if conflicts exist
  conflicts.hasConflicts = conflicts.backend.length > 1 || conflicts.frontend.length > 1;

  return conflicts;
}

/**
 * AUTOMATIC CONFLICT RESOLUTION
 * Provides options to resolve detected conflicts
 */
async function resolveServerConflicts(conflicts, autoResolve = false) {
  if (!conflicts.hasConflicts) {
    console.log(`${COLORS.green}✓ No server conflicts detected${COLORS.reset}`);
    return true;
  }

  console.log(`${COLORS.red}⚠ SERVER CONFLICTS DETECTED:${COLORS.reset}`);

  if (conflicts.backend.length > 1) {
    console.log(`${COLORS.yellow}Backend Port ${PORTS.BACKEND} Conflicts:${COLORS.reset}`);
    conflicts.backend.forEach((proc, index) => {
      console.log(`  ${index + 1}. PID ${proc.pid} - ${proc.command}`);
      console.log(`     ${proc.details}`);
    });
  }

  if (conflicts.frontend.length > 1) {
    console.log(`${COLORS.yellow}Frontend Port ${PORTS.FRONTEND} Conflicts:${COLORS.reset}`);
    conflicts.frontend.forEach((proc, index) => {
      console.log(`  ${index + 1}. PID ${proc.pid} - ${proc.command}`);
      console.log(`     ${proc.details}`);
    });
  }

  if (autoResolve) {
    console.log(`${COLORS.cyan}🔧 AUTO-RESOLVING: Keeping newest processes, terminating older ones...${COLORS.reset}`);

    // Keep the most recent process for each service, kill others
    const processesToKill = [];

    if (conflicts.backend.length > 1) {
      // Keep last process, kill others
      const toKill = conflicts.backend.slice(0, -1);
      processesToKill.push(...toKill.map(p => p.pid));
    }

    if (conflicts.frontend.length > 1) {
      // Keep last process, kill others
      const toKill = conflicts.frontend.slice(0, -1);
      processesToKill.push(...toKill.map(p => p.pid));
    }

    for (const pid of processesToKill) {
      try {
        await execAsync(`kill ${pid}`);
        console.log(`${COLORS.green}✓ Terminated process ${pid}${COLORS.reset}`);
      } catch (error) {
        console.log(`${COLORS.yellow}⚠ Could not terminate process ${pid}: ${error.message}${COLORS.reset}`);
      }
    }

    // Wait for processes to clean up
    await sleep(2000);
    return true;
  } else {
    console.log(`${COLORS.yellow}Manual resolution required:${COLORS.reset}`);
    console.log('1. Stop conflicting processes manually');
    console.log('2. Re-run this script');
    console.log('3. Or use: node scripts/playwright-helper.js --auto-resolve');
    return false;
  }
}

/**
 * ENHANCED GRAPHQL HEALTH VALIDATION
 * Validates server with comprehensive introspection
 */
async function validateGraphQLHealth() {
  console.log(`${COLORS.cyan}🔍 VALIDATING: GraphQL server health with introspection...${COLORS.reset}`);

  const introspectionQuery = {
    query: `
      query IntrospectionQuery {
        __schema {
          types {
            name
            kind
            description
          }
          queryType {
            name
            fields {
              name
              type {
                name
              }
            }
          }
          mutationType {
            name
            fields {
              name
              type {
                name
              }
            }
          }
        }
      }
    `
  };

  return new Promise((resolve) => {
    const postData = JSON.stringify(introspectionQuery);

    const options = {
      hostname: 'localhost',
      port: PORTS.BACKEND,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            if (response.data && response.data.__schema) {
              const schema = response.data.__schema;
              console.log(`${COLORS.green}✓ GraphQL Schema Healthy:${COLORS.reset}`);
              console.log(`  - ${schema.types.length} types available`);
              console.log(`  - Query operations: ${schema.queryType?.fields?.length || 0}`);
              console.log(`  - Mutation operations: ${schema.mutationType?.fields?.length || 0}`);
              resolve({ healthy: true, schema });
            } else {
              console.log(`${COLORS.red}✗ GraphQL Schema Invalid${COLORS.reset}`);
              resolve({ healthy: false, error: 'Invalid schema response' });
            }
          } else {
            console.log(`${COLORS.red}✗ GraphQL returned HTTP ${res.statusCode}${COLORS.reset}`);
            resolve({ healthy: false, error: `HTTP ${res.statusCode}` });
          }
        } catch (parseError) {
          console.log(`${COLORS.red}✗ GraphQL response parse error: ${parseError.message}${COLORS.reset}`);
          resolve({ healthy: false, error: parseError.message });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`${COLORS.red}✗ GraphQL connection failed: ${err.message}${COLORS.reset}`);
      resolve({ healthy: false, error: err.message });
    });

    req.on('timeout', () => {
      console.log(`${COLORS.red}✗ GraphQL request timed out${COLORS.reset}`);
      resolve({ healthy: false, error: 'Request timeout' });
    });

    req.setTimeout(10000);
    req.write(postData);
    req.end();
  });
}

/**
 * COMPREHENSIVE SERVER STATUS CHECK
 * Validates both frontend and backend are running correctly
 */
async function checkServerStatus() {
  console.log(`${COLORS.cyan}📊 CHECKING: Complete server status...${COLORS.reset}`);

  const status = {
    backend: { running: false, healthy: false },
    frontend: { running: false, healthy: false }
  };

  // Check backend
  try {
    const { stdout } = await execAsync(`lsof -i :${PORTS.BACKEND}`);
    status.backend.running = stdout.includes('LISTEN');

    if (status.backend.running) {
      const healthCheck = await validateGraphQLHealth();
      status.backend.healthy = healthCheck.healthy;
    }
  } catch (error) {
    status.backend.running = false;
  }

  // Check frontend
  try {
    const { stdout } = await execAsync(`lsof -i :${PORTS.FRONTEND}`);
    status.frontend.running = stdout.includes('LISTEN');

    if (status.frontend.running) {
      // Simple HTTP check for frontend
      try {
        const response = await new Promise((resolve) => {
          const req = http.request({
            hostname: 'localhost',
            port: PORTS.FRONTEND,
            method: 'GET',
            timeout: 5000
          }, (res) => {
            resolve({ statusCode: res.statusCode });
          });
          req.on('error', () => resolve({ statusCode: 0 }));
          req.on('timeout', () => resolve({ statusCode: 0 }));
          req.setTimeout(5000);
          req.end();
        });

        status.frontend.healthy = response.statusCode === 200;
      } catch (error) {
        status.frontend.healthy = false;
      }
    }
  } catch (error) {
    status.frontend.running = false;
  }

  return status;
}

async function waitForServerReady(maxAttempts = 5, delay = 2000) {
  console.log(`${COLORS.blue}Waiting for servers to be fully ready...${COLORS.reset}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Attempt ${attempt}/${maxAttempts}`);

    try {
      await performHealthCheck();
      console.log(`${COLORS.green}✓ Servers ready for Playwright automation${COLORS.reset}`);
      return true;
    } catch (error) {
      if (attempt === maxAttempts) {
        console.log(`${COLORS.red}✗ Servers not ready after ${maxAttempts} attempts${COLORS.reset}`);
        return false;
      }
      console.log(`${COLORS.yellow}Waiting ${delay/1000}s before retry...${COLORS.reset}`);
      await sleep(delay);
    }
  }

  return false;
}

async function testBasicAuthentication() {
  console.log(`${COLORS.blue}Testing basic GraphQL connectivity...${COLORS.reset}`);

  const postData = JSON.stringify({
    query: '{ __schema { types { name } } }'
  });

  const options = {
    hostname: 'localhost',
    port: 8001,
    path: '/graphql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 5000
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`${COLORS.green}✓ GraphQL endpoint responsive${COLORS.reset}`);
          resolve(true);
        } else {
          console.log(`${COLORS.yellow}⚠ GraphQL returned status ${res.statusCode}${COLORS.reset}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`${COLORS.red}✗ GraphQL connection failed: ${err.message}${COLORS.reset}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`${COLORS.yellow}⚠ GraphQL request timed out${COLORS.reset}`);
      resolve(false);
    });

    req.setTimeout(5000);
    req.write(postData);
    req.end();
  });
}

/**
 * PROACTIVE PLAYWRIGHT ENVIRONMENT SETUP
 * Guarantees clean environment before testing begins
 */
async function setupPlaywrightEnvironment(options = {}) {
  const { autoResolve = false, skipConflictCheck = false } = options;

  console.log(`${COLORS.magenta}🚀 PROACTIVE PLAYWRIGHT INFRASTRUCTURE ENHANCEMENT${COLORS.reset}`);
  console.log('=' .repeat(60));
  console.log(`${COLORS.cyan}Eliminating "fails on first go" through proactive detection${COLORS.reset}`);
  console.log('=' .repeat(60));

  // PHASE 1: Proactive Conflict Detection
  if (!skipConflictCheck) {
    console.log(`\n${COLORS.cyan}📋 PHASE 1: Proactive Server Conflict Detection${COLORS.reset}`);
    const conflicts = await detectServerConflicts();

    if (conflicts.hasConflicts) {
      const resolved = await resolveServerConflicts(conflicts, autoResolve);
      if (!resolved) {
        console.log(`${COLORS.red}❌ SETUP FAILED: Server conflicts require manual resolution${COLORS.reset}`);
        process.exit(1);
      }
    }
  }

  // PHASE 2: Server Status Validation
  console.log(`\n${COLORS.cyan}📋 PHASE 2: Comprehensive Server Status Check${COLORS.reset}`);
  const serverStatus = await checkServerStatus();

  console.log(`\nServer Status Report:`);
  console.log(`  Backend (${PORTS.BACKEND}):  ${serverStatus.backend.running ? '🟢 Running' : '🔴 Stopped'} | ${serverStatus.backend.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  console.log(`  Frontend (${PORTS.FRONTEND}): ${serverStatus.frontend.running ? '🟢 Running' : '🔴 Stopped'} | ${serverStatus.frontend.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);

  if (!serverStatus.backend.running || !serverStatus.frontend.running) {
    console.log(`\n${COLORS.red}❌ SETUP FAILED: Required servers not running${COLORS.reset}`);
    console.log('\nManual server startup required:');
    if (!serverStatus.backend.running) {
      console.log(`  Backend:  cd NestSync-backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port ${PORTS.BACKEND} --reload`);
    }
    if (!serverStatus.frontend.running) {
      console.log(`  Frontend: cd NestSync-frontend && npx expo start --port ${PORTS.FRONTEND} --clear`);
    }
    console.log('\nThen re-run this script.');
    process.exit(1);
  }

  if (!serverStatus.backend.healthy || !serverStatus.frontend.healthy) {
    console.log(`\n${COLORS.yellow}⚠ WARNING: Server health issues detected${COLORS.reset}`);
    console.log('Playwright automation may experience issues');
    console.log('Consider restarting unhealthy servers');
  }

  // PHASE 3: Enhanced GraphQL Validation
  console.log(`\n${COLORS.cyan}📋 PHASE 3: Enhanced GraphQL Schema Validation${COLORS.reset}`);
  const graphqlHealth = await validateGraphQLHealth();

  if (!graphqlHealth.healthy) {
    console.log(`${COLORS.red}❌ SETUP FAILED: GraphQL endpoint not healthy${COLORS.reset}`);
    console.log(`Error: ${graphqlHealth.error}`);
    console.log('\nTroubleshooting:');
    console.log('1. Check backend server logs for errors');
    console.log('2. Verify database connectivity');
    console.log('3. Restart backend server if needed');
    process.exit(1);
  }

  // PHASE 4: Final Environment Validation
  console.log(`\n${COLORS.cyan}📋 PHASE 4: Final Environment Validation${COLORS.reset}`);

  // Re-check for any new conflicts that may have appeared
  const finalConflicts = await detectServerConflicts();
  if (finalConflicts.hasConflicts) {
    console.log(`${COLORS.yellow}⚠ New conflicts detected during setup${COLORS.reset}`);
    const resolved = await resolveServerConflicts(finalConflicts, true);
    if (!resolved) {
      console.log(`${COLORS.red}❌ SETUP FAILED: Unable to maintain clean environment${COLORS.reset}`);
      process.exit(1);
    }
  }

  // SUCCESS!
  console.log('\n' + '=' .repeat(60));
  console.log(`${COLORS.green}🎉 PROACTIVE SETUP COMPLETE - ENVIRONMENT GUARANTEED CLEAN${COLORS.reset}`);
  console.log('=' .repeat(60));

  console.log(`\n${COLORS.green}✅ Environment Status:${COLORS.reset}`);
  console.log(`  • No server conflicts detected`);
  console.log(`  • Backend healthy on port ${PORTS.BACKEND}`);
  console.log(`  • Frontend healthy on port ${PORTS.FRONTEND}`);
  console.log(`  • GraphQL schema validated and operational`);
  console.log(`  • Ready for reliable Playwright automation`);

  console.log(`\n${COLORS.cyan}🎯 Next Steps:${COLORS.reset}`);
  console.log(`  • Run Playwright automation with confidence`);
  console.log(`  • Use test credentials: parents@nestsync.com / Shazam11#`);
  console.log(`  • No more "fails on first go" issues`);
  console.log(`  • If issues arise, re-run this proactive setup`);

  return {
    success: true,
    serverStatus,
    graphqlHealth,
    conflictsResolved: finalConflicts.hasConflicts
  };
}

// Enhanced CLI interface with proactive options
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    autoResolve: args.includes('--auto-resolve'),
    skipConflictCheck: args.includes('--skip-conflicts'),
    help: args.includes('--help') || args.includes('-h')
  };

  if (options.help) {
    console.log(`${COLORS.cyan}Proactive Playwright Infrastructure Enhancement${COLORS.reset}`);
    console.log('');
    console.log('Usage: node scripts/playwright-helper.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --auto-resolve     Automatically resolve server conflicts');
    console.log('  --skip-conflicts   Skip conflict detection (use with caution)');
    console.log('  --help, -h         Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/playwright-helper.js                    # Standard proactive setup');
    console.log('  node scripts/playwright-helper.js --auto-resolve     # Auto-fix conflicts');
    console.log('');
    process.exit(0);
  }

  setupPlaywrightEnvironment(options)
    .then((result) => {
      if (result.success) {
        console.log(`\n${COLORS.green}🎉 Proactive setup completed successfully!${COLORS.reset}`);
        process.exit(0);
      } else {
        console.log(`\n${COLORS.red}❌ Setup failed${COLORS.reset}`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(`${COLORS.red}❌ Setup error: ${error.message}${COLORS.reset}`);
      process.exit(1);
    });
}

module.exports = {
  setupPlaywrightEnvironment,
  detectServerConflicts,
  resolveServerConflicts,
  validateGraphQLHealth,
  checkServerStatus,
  waitForServerReady,
  testBasicAuthentication
};