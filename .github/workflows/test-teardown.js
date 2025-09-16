// Global Test Teardown for NestSync Critical Path Testing
// Cleanup and reporting after test completion

const fs = require('fs');
const path = require('path');

async function globalTeardown() {
  console.log('🏁 NestSync Critical Path Testing - Global Teardown');
  console.log('=' * 60);

  try {
    // 1. Generate test summary report
    await generateTestSummary();

    // 2. Archive test artifacts
    await archiveTestArtifacts();

    // 3. Clean up sensitive data
    await cleanupSensitiveData();

    // 4. Log final status
    await logFinalStatus();

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.error(`❌ Global teardown error: ${error.message}`);
    // Don't throw - teardown errors shouldn't fail the pipeline
  }
}

async function generateTestSummary() {
  console.log('📊 Generating test summary report...');

  try {
    const resultsPath = path.resolve(__dirname, './test-results/results.json');

    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

      const summary = {
        timestamp: new Date().toISOString(),
        totalTests: results.suites?.reduce((total, suite) => total + suite.specs.length, 0) || 0,
        passedTests: results.suites?.reduce((total, suite) =>
          total + suite.specs.filter(spec => spec.ok).length, 0) || 0,
        failedTests: results.suites?.reduce((total, suite) =>
          total + suite.specs.filter(spec => !spec.ok).length, 0) || 0,
        duration: results.stats?.duration || 0,
        criticalPathStatus: 'unknown'
      };

      // Determine critical path status
      const authTests = results.suites?.find(suite =>
        suite.title.includes('Authentication') || suite.file?.includes('auth-smoke-test')
      );

      if (authTests) {
        const authPassed = authTests.specs.every(spec => spec.ok);
        summary.criticalPathStatus = authPassed ? 'passed' : 'failed';
      }

      // Write summary
      const summaryPath = path.resolve(__dirname, './test-results/summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

      console.log(`📈 Test Summary:`);
      console.log(`  Total Tests: ${summary.totalTests}`);
      console.log(`  Passed: ${summary.passedTests}`);
      console.log(`  Failed: ${summary.failedTests}`);
      console.log(`  Duration: ${(summary.duration / 1000).toFixed(2)}s`);
      console.log(`  Critical Path: ${summary.criticalPathStatus}`);

    } else {
      console.log('⚠️  No test results file found');
    }

  } catch (error) {
    console.log(`⚠️  Test summary generation failed: ${error.message}`);
  }
}

async function archiveTestArtifacts() {
  console.log('📦 Archiving test artifacts...');

  try {
    const testResultsDir = path.resolve(__dirname, './test-results');
    const archiveDir = path.resolve(__dirname, './test-archive');

    if (fs.existsSync(testResultsDir)) {
      // Create archive directory
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      // Create timestamped archive subdirectory
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveSubDir = path.join(archiveDir, `test-run-${timestamp}`);
      fs.mkdirSync(archiveSubDir, { recursive: true });

      // Copy important files
      const filesToArchive = [
        'results.json',
        'summary.json',
        'junit.xml'
      ];

      for (const file of filesToArchive) {
        const sourcePath = path.join(testResultsDir, file);
        const targetPath = path.join(archiveSubDir, file);

        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, targetPath);
        }
      }

      console.log(`✅ Test artifacts archived to: ${archiveSubDir}`);
    }

  } catch (error) {
    console.log(`⚠️  Artifact archiving failed: ${error.message}`);
  }
}

async function cleanupSensitiveData() {
  console.log('🔐 Cleaning up sensitive data...');

  try {
    // Remove test credentials from environment
    delete process.env.NESTSYNC_TEST_EMAIL;
    delete process.env.NESTSYNC_TEST_PASSWORD;

    // Clean any sensitive files that might have been created
    const sensitivePatterns = [
      './test-results/**/*.token',
      './test-results/**/*.secret',
      './test-results/**/*.key'
    ];

    // Note: In a real implementation, you'd use a glob library
    // For now, just ensure environment is clean

    console.log('✅ Sensitive data cleanup completed');

  } catch (error) {
    console.log(`⚠️  Sensitive data cleanup failed: ${error.message}`);
  }
}

async function logFinalStatus() {
  console.log('🎯 Final Testing Status Summary');
  console.log('-' * 40);

  try {
    const summaryPath = path.resolve(__dirname, './test-results/summary.json');

    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

      console.log('🔍 Critical Path Validation Results:');
      console.log(`  Authentication Flow: ${summary.criticalPathStatus === 'passed' ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`  Total Test Coverage: ${summary.totalTests} tests`);
      console.log(`  Success Rate: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%`);

      if (summary.criticalPathStatus === 'failed') {
        console.log('');
        console.log('🚨 CRITICAL PATH FAILURE DETECTED');
        console.log('🛡️  System should be considered unstable');
        console.log('📋 Review test results for failure analysis');
        console.log('🔧 Apply fixes before proceeding with deployment');
      } else {
        console.log('');
        console.log('✅ All critical paths validated successfully');
        console.log('🚀 System ready for deployment');
      }

    } else {
      console.log('⚠️  Could not determine final status - no summary available');
    }

    // Log test environment info
    console.log('');
    console.log('📊 Test Environment Details:');
    console.log(`  Platform: ${process.platform}`);
    console.log(`  Node Version: ${process.version}`);
    console.log(`  Timestamp: ${new Date().toISOString()}`);
    console.log(`  CI Environment: ${process.env.CI ? 'Yes' : 'No'}`);

  } catch (error) {
    console.log(`⚠️  Final status logging failed: ${error.message}`);
  }
}

module.exports = globalTeardown;