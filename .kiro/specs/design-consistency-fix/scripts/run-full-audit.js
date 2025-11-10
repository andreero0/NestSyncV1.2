/**
 * Design System Audit - Master Script
 * 
 * Runs the complete audit process:
 * 1. Capture reference screen screenshots
 * 2. Capture inconsistent screen screenshots
 * 3. Extract design tokens from reference screens
 * 4. Generate comprehensive audit report
 */

const { spawn } = require('child_process');
const path = require('path');

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${scriptName}`);
    console.log('='.repeat(60));
    
    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${scriptName} exited with code ${code}`));
      } else {
        resolve();
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runFullAudit() {
  console.log('🎨 Design System Audit - Full Process');
  console.log('=====================================\n');
  console.log('This will run all audit steps in sequence:\n');
  console.log('1. Capture reference screen screenshots');
  console.log('2. Capture inconsistent screen screenshots');
  console.log('3. Extract design tokens');
  console.log('4. Generate audit report\n');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Capture reference screens
    await runScript('capture-reference-screens.js');
    console.log('\n✅ Step 1 complete: Reference screens captured\n');
    
    // Step 2: Capture inconsistent screens
    await runScript('capture-inconsistent-screens.js');
    console.log('\n✅ Step 2 complete: Inconsistent screens captured\n');
    
    // Step 3: Extract design tokens
    await runScript('extract-design-tokens.js');
    console.log('\n✅ Step 3 complete: Design tokens extracted\n');
    
    // Step 4: Generate audit report
    await runScript('generate-audit-report.js');
    console.log('\n✅ Step 4 complete: Audit report generated\n');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ AUDIT COMPLETE');
    console.log('='.repeat(60));
    console.log(`\nTotal time: ${duration}s`);
    console.log('\n📁 Output files:');
    console.log('   - audit-screenshots/reference/');
    console.log('   - audit-screenshots/inconsistent/');
    console.log('   - design-tokens-reference.json');
    console.log('   - design-audit-report.md');
    console.log('\n📖 Next steps:');
    console.log('   1. Review design-audit-report.md');
    console.log('   2. Examine screenshots for visual comparison');
    console.log('   3. Prioritize fixes based on severity');
    console.log('   4. Begin implementation of fixes\n');
    
  } catch (error) {
    console.error('\n❌ Audit failed:', error.message);
    console.error('\nYou can run individual scripts manually:');
    console.error('   node capture-reference-screens.js');
    console.error('   node capture-inconsistent-screens.js');
    console.error('   node extract-design-tokens.js');
    console.error('   node generate-audit-report.js');
    process.exit(1);
  }
}

// Run the full audit
runFullAudit();
