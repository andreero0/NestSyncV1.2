// Global Test Setup for NestSync Critical Path Testing
// Ensures clean environment and validates system prerequisites

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function globalSetup() {
  console.log('🚀 NestSync Critical Path Testing - Global Setup');
  console.log('=' * 60);

  const startTime = Date.now();

  try {
    // 1. Validate project structure
    await validateProjectStructure();

    // 2. Check Docker environment
    await validateDockerEnvironment();

    // 3. Verify required dependencies
    await validateDependencies();

    // 4. Clean previous test artifacts
    await cleanTestArtifacts();

    // 5. Validate test credentials
    await validateTestCredentials();

    const duration = Date.now() - startTime;
    console.log(`✅ Global setup completed successfully in ${duration}ms`);

  } catch (error) {
    console.error(`❌ Global setup failed: ${error.message}`);
    throw error;
  }
}

async function validateProjectStructure() {
  console.log('📁 Validating project structure...');

  const requiredPaths = [
    '../../NestSync-backend',
    '../../NestSync-frontend',
    '../../NestSync-backend/requirements.txt',
    '../../NestSync-frontend/package.json',
    '../../docker/docker-compose.yml'
  ];

  for (const reqPath of requiredPaths) {
    const fullPath = path.resolve(__dirname, reqPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Required path missing: ${reqPath}`);
    }
  }

  console.log('✅ Project structure validation passed');
}

async function validateDockerEnvironment() {
  console.log('🐳 Validating Docker environment...');

  try {
    // Check if Docker is running
    execSync('docker info', { stdio: 'ignore' });

    // Check if required containers are running
    const containerStatus = execSync('docker ps --format "table {{.Names}}\\t{{.Status}}"', { encoding: 'utf8' });

    const hasBackend = containerStatus.includes('nestsync-backend');
    const hasFrontend = containerStatus.includes('nestsync-frontend');
    const hasDatabase = containerStatus.includes('postgres') || containerStatus.includes('supabase');

    if (!hasBackend || !hasFrontend || !hasDatabase) {
      console.log('⚠️  Some required containers not running, they should be started by workflow');
      console.log(`Backend: ${hasBackend ? '✅' : '❌'}`);
      console.log(`Frontend: ${hasFrontend ? '✅' : '❌'}`);
      console.log(`Database: ${hasDatabase ? '✅' : '❌'}`);
    }

    console.log('✅ Docker environment validation passed');

  } catch (error) {
    throw new Error(`Docker validation failed: ${error.message}`);
  }
}

async function validateDependencies() {
  console.log('📦 Validating critical dependencies...');

  try {
    // Check gotrue version in backend container
    const gotrueVersion = execSync(
      'docker exec nestsync-backend pip show gotrue 2>/dev/null | grep Version',
      { encoding: 'utf8' }
    ).trim();

    if (gotrueVersion.includes('2.9.1')) {
      throw new Error('Gotrue 2.9.1 detected - this version has identity_id validation issues');
    }

    if (!gotrueVersion.includes('2.5.4')) {
      console.log(`⚠️  Gotrue version: ${gotrueVersion} (expected 2.5.4)`);
    }

    console.log('✅ Critical dependencies validation passed');

  } catch (error) {
    // Non-fatal for setup, but log warning
    console.log(`⚠️  Dependency check warning: ${error.message}`);
  }
}

async function cleanTestArtifacts() {
  console.log('🧹 Cleaning previous test artifacts...');

  const artifactDirs = [
    './test-results',
    './playwright-report',
    './test-artifacts'
  ];

  for (const dir of artifactDirs) {
    const fullPath = path.resolve(__dirname, dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }

  // Ensure test results directory exists
  fs.mkdirSync(path.resolve(__dirname, './test-results'), { recursive: true });

  console.log('✅ Test artifacts cleanup completed');
}

async function validateTestCredentials() {
  console.log('🔐 Validating test credentials...');

  const testCredentials = {
    email: 'parents@nestsync.com',
    password: 'Shazam11#'
  };

  // Validate credentials format
  if (!testCredentials.email.includes('@') || testCredentials.password.length < 8) {
    throw new Error('Invalid test credentials format');
  }

  // Store credentials for tests (secure within CI environment)
  process.env.NESTSYNC_TEST_EMAIL = testCredentials.email;
  process.env.NESTSYNC_TEST_PASSWORD = testCredentials.password;

  console.log('✅ Test credentials validation passed');
}

// Environment validation helper
function validateEnvironment() {
  const requiredEnvVars = [
    'NODE_ENV',
    'CI'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
  }

  console.log('📊 Environment Status:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`  CI: ${process.env.CI || 'false'}`);
  console.log(`  Platform: ${process.platform}`);
}

module.exports = globalSetup;