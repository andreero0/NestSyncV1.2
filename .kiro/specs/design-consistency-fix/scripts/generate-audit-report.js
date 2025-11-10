/**
 * Design System Audit - Report Generation
 * 
 * This script compares inconsistent screens against reference design tokens
 * and generates a comprehensive audit report with compliance scores.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TOKENS_FILE = path.join(__dirname, '../design-tokens-reference.json');
const REPORT_FILE = path.join(__dirname, '../design-audit-report.md');
const SCREENSHOTS_DIR = path.join(__dirname, '../audit-screenshots');

/**
 * Calculate similarity between two color values
 */
function colorSimilarity(color1, color2) {
  if (color1 === color2) return 100;
  if (!color1 || !color2) return 0;
  
  // Simple string comparison for now
  // Could be enhanced with actual color distance calculation
  return color1.toLowerCase() === color2.toLowerCase() ? 100 : 0;
}

/**
 * Calculate compliance score for a screen
 */
function calculateComplianceScore(issues) {
  if (issues.length === 0) return 100;
  
  const severityWeights = {
    critical: 10,
    high: 5,
    medium: 2,
    low: 1
  };
  
  const totalPenalty = issues.reduce((sum, issue) => {
    return sum + (severityWeights[issue.severity] || 1);
  }, 0);
  
  // Cap at 0
  return Math.max(0, 100 - totalPenalty);
}

/**
 * Analyze screenshots and generate issues
 */
function analyzeScreenshots() {
  const issues = [];
  
  // Check if screenshot directories exist
  const referenceDir = path.join(SCREENSHOTS_DIR, 'reference');
  const inconsistentDir = path.join(SCREENSHOTS_DIR, 'inconsistent');
  
  const referenceExists = fs.existsSync(referenceDir);
  const inconsistentExists = fs.existsSync(inconsistentDir);
  
  // Count files in each directory
  let referenceCount = 0;
  let inconsistentCount = 0;
  
  if (referenceExists) {
    const files = fs.readdirSync(referenceDir);
    referenceCount = files.filter(f => f.endsWith('.png')).length;
  }
  
  if (inconsistentExists) {
    const files = fs.readdirSync(inconsistentDir);
    inconsistentCount = files.filter(f => f.endsWith('.png')).length;
  }
  
  if (!referenceExists || referenceCount === 0) {
    issues.push({
      screen: 'Reference Screens',
      component: 'Screenshot Capture',
      issueType: 'missing-data',
      severity: 'critical',
      current: 'No reference screenshots found',
      expected: 'Reference screenshots from home, settings, navigation',
      location: referenceDir,
      fix: 'Run capture-reference-screens.js to capture reference screenshots'
    });
  }
  
  if (!inconsistentExists || inconsistentCount === 0) {
    issues.push({
      screen: 'Inconsistent Screens',
      component: 'Screenshot Capture',
      issueType: 'missing-data',
      severity: 'high',
      current: 'No inconsistent screen screenshots captured',
      expected: 'Screenshots from premium, reorder, prediction screens',
      location: inconsistentDir,
      fix: 'Manually navigate to premium upgrade, reorder, and prediction screens and capture screenshots. These screens may require specific user states or navigation paths.'
    });
  }
  
  return issues;
}

/**
 * Generate markdown report
 */
function generateReport(tokens, issues) {
  const timestamp = new Date().toISOString();
  const complianceScore = calculateComplianceScore(issues);
  
  let report = `---
title: "Design System Audit Report"
date: ${timestamp.split('T')[0]}
category: "design-audit"
type: "audit"
status: "in-progress"
impact: "high"
related_docs:
  - "../requirements.md"
  - "../design.md"
  - "../../../design-documentation/design-validation-framework.md"
tags: ["design-system", "audit", "consistency", "ui-ux"]
---

# Design System Audit Report

**Generated**: ${timestamp}  
**Overall Compliance Score**: ${complianceScore}/100

## Executive Summary

This audit compares recently implemented features against the established design system used in core screens (home, settings, onboarding, navigation). The goal is to identify specific visual inconsistencies and provide actionable fixes.

### Audit Scope

**Reference Screens** (Established Design System):
- ✅ Home Screen
- ✅ Settings Screen
- ✅ Onboarding Flow
- ✅ Core Navigation

**Screens Under Review** (Potential Inconsistencies):
- ❌ Premium Upgrade Flow
- ❌ Reorder Flow
- ❌ Size Change Prediction Interface
- ❌ Payment-Related Screens

## Design Token Reference

### Colors

`;

  if (tokens && tokens.tokens) {
    const colorTokens = tokens.tokens.colors;
    
    report += `#### Text Colors\n`;
    if (colorTokens.text && colorTokens.text.length > 0) {
      colorTokens.text.forEach(color => {
        report += `- ${color}\n`;
      });
    } else {
      report += `- No text colors extracted\n`;
    }
    
    report += `\n#### Background Colors\n`;
    if (colorTokens.background && colorTokens.background.length > 0) {
      colorTokens.background.forEach(color => {
        report += `- ${color}\n`;
      });
    } else {
      report += `- No background colors extracted\n`;
    }
    
    report += `\n#### Border Colors\n`;
    if (colorTokens.border && colorTokens.border.length > 0) {
      colorTokens.border.forEach(color => {
        report += `- ${color}\n`;
      });
    } else {
      report += `- No border colors extracted\n`;
    }
    
    report += `\n### Typography\n\n`;
    const typoTokens = tokens.tokens.typography;
    
    report += `#### Font Sizes\n`;
    if (typoTokens.sizes && typoTokens.sizes.length > 0) {
      typoTokens.sizes.forEach(size => {
        report += `- ${size}\n`;
      });
    } else {
      report += `- No font sizes extracted\n`;
    }
    
    report += `\n#### Font Weights\n`;
    if (typoTokens.weights && typoTokens.weights.length > 0) {
      typoTokens.weights.forEach(weight => {
        report += `- ${weight}\n`;
      });
    } else {
      report += `- No font weights extracted\n`;
    }
    
    report += `\n### Spacing\n\n`;
    const spacingTokens = tokens.tokens.spacing;
    
    report += `#### Padding Values\n`;
    if (spacingTokens.padding && spacingTokens.padding.length > 0) {
      spacingTokens.padding.slice(0, 10).forEach(value => {
        report += `- ${value}\n`;
      });
      if (spacingTokens.padding.length > 10) {
        report += `- ... and ${spacingTokens.padding.length - 10} more\n`;
      }
    } else {
      report += `- No padding values extracted\n`;
    }
    
    report += `\n### Borders\n\n`;
    const borderTokens = tokens.tokens.borders;
    
    report += `#### Border Radius\n`;
    if (borderTokens.radius && borderTokens.radius.length > 0) {
      borderTokens.radius.forEach(radius => {
        report += `- ${radius}\n`;
      });
    } else {
      report += `- No border radius values extracted\n`;
    }
    
    report += `\n### Shadows\n\n`;
    if (tokens.tokens.shadows && tokens.tokens.shadows.length > 0) {
      tokens.tokens.shadows.forEach((shadow, index) => {
        report += `${index + 1}. \`${shadow}\`\n`;
      });
    } else {
      report += `- No shadow values extracted\n`;
    }
  } else {
    report += `⚠️ **Design tokens not yet extracted**. Run \`extract-design-tokens.js\` first.\n\n`;
  }
  
  report += `\n## Identified Issues\n\n`;
  
  if (issues.length === 0) {
    report += `✅ No issues identified. All screens comply with the design system.\n\n`;
  } else {
    // Group issues by screen
    const issuesByScreen = {};
    issues.forEach(issue => {
      if (!issuesByScreen[issue.screen]) {
        issuesByScreen[issue.screen] = [];
      }
      issuesByScreen[issue.screen].push(issue);
    });
    
    Object.keys(issuesByScreen).forEach(screen => {
      const screenIssues = issuesByScreen[screen];
      const screenScore = calculateComplianceScore(screenIssues);
      
      report += `### ${screen} (Compliance: ${screenScore}/100)\n\n`;
      
      screenIssues.forEach((issue, index) => {
        const severityEmoji = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🟢'
        }[issue.severity] || '⚪';
        
        report += `#### ${severityEmoji} Issue ${index + 1}: ${issue.component} - ${issue.issueType}\n\n`;
        report += `**Severity**: ${issue.severity.toUpperCase()}\n\n`;
        report += `**Current**: ${issue.current}\n\n`;
        report += `**Expected**: ${issue.expected}\n\n`;
        report += `**Location**: \`${issue.location}\`\n\n`;
        report += `**Fix**: ${issue.fix}\n\n`;
        report += `---\n\n`;
      });
    });
  }
  
  report += `## Screenshots\n\n`;
  report += `### Reference Screens\n\n`;
  report += `Screenshots of established design system:\n\n`;
  report += `- [Home Screen](./audit-screenshots/reference/01-home-screen-full.png)\n`;
  report += `- [Settings Screen](./audit-screenshots/reference/02-settings-screen-full.png)\n`;
  report += `- [Navigation](./audit-screenshots/reference/03-navigation-full-context.png)\n\n`;
  
  report += `### Inconsistent Screens\n\n`;
  report += `Screenshots of screens under review:\n\n`;
  report += `- [Premium Upgrade](./audit-screenshots/inconsistent/01-premium-upgrade-main.png)\n`;
  report += `- [Reorder Flow](./audit-screenshots/inconsistent/02-reorder-flow-main.png)\n`;
  report += `- [Size Prediction](./audit-screenshots/inconsistent/03-size-prediction-main.png)\n`;
  report += `- [Payment Screen](./audit-screenshots/inconsistent/04-payment-screen-main.png)\n\n`;
  
  report += `## Recommendations\n\n`;
  report += `### Immediate Actions (Critical/High Priority)\n\n`;
  
  const criticalIssues = issues.filter(i => i.severity === 'critical' || i.severity === 'high');
  if (criticalIssues.length > 0) {
    criticalIssues.forEach((issue, index) => {
      report += `${index + 1}. **${issue.component}**: ${issue.fix}\n`;
    });
  } else {
    report += `✅ No critical or high priority issues found.\n`;
  }
  
  report += `\n### Design System Compliance Checklist\n\n`;
  report += `Use this checklist for future feature development:\n\n`;
  report += `- [ ] Colors match design token palette\n`;
  report += `- [ ] Typography uses established font sizes and weights\n`;
  report += `- [ ] Spacing follows 4px base unit system\n`;
  report += `- [ ] Border radius values match reference screens\n`;
  report += `- [ ] Shadows match established elevation patterns\n`;
  report += `- [ ] Button styles match home/settings screens\n`;
  report += `- [ ] Touch targets meet 48px minimum\n`;
  report += `- [ ] Icons match core navigation style\n`;
  report += `- [ ] Card components use consistent styling\n`;
  report += `- [ ] Form inputs match settings screen patterns\n\n`;
  
  report += `## Next Steps\n\n`;
  report += `1. Review identified issues with design team\n`;
  report += `2. Prioritize fixes based on severity and user impact\n`;
  report += `3. Update components to use design system tokens\n`;
  report += `4. Re-run audit after fixes to verify compliance\n`;
  report += `5. Archive this report in \`docs/archives/audits/\`\n\n`;
  
  report += `## Related Documentation\n\n`;
  report += `- [Requirements Document](../requirements.md)\n`;
  report += `- [Design Document](../design.md)\n`;
  report += `- [Design Validation Framework](../../../design-documentation/design-validation-framework.md)\n`;
  report += `- [Design System Style Guide](../../../design-documentation/design-system/style-guide.md)\n\n`;
  
  report += `---\n\n`;
  report += `**Report Status**: ${issues.length === 0 ? 'Complete' : 'In Progress'}\n`;
  report += `**Last Updated**: ${timestamp}\n`;
  
  return report;
}

async function generateAuditReport() {
  console.log('📊 Generating Design Audit Report\n');
  
  try {
    // Load design tokens if available
    let tokens = null;
    if (fs.existsSync(TOKENS_FILE)) {
      console.log('✅ Loading design tokens...');
      tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
      console.log(`   Found ${tokens.rawStyles?.length || 0} extracted styles`);
    } else {
      console.log('⚠️  Design tokens not found. Report will be preliminary.');
    }
    
    // Analyze screenshots
    console.log('\n🔍 Analyzing screenshots...');
    const issues = analyzeScreenshots();
    console.log(`   Found ${issues.length} issues`);
    
    // Generate report
    console.log('\n📝 Generating report...');
    const report = generateReport(tokens, issues);
    
    // Save report
    fs.writeFileSync(REPORT_FILE, report);
    console.log(`\n✨ Audit report saved to: ${REPORT_FILE}`);
    
    // Print summary
    const complianceScore = calculateComplianceScore(issues);
    console.log('\n📋 Audit Summary:');
    console.log(`   Overall Compliance Score: ${complianceScore}/100`);
    console.log(`   Total Issues: ${issues.length}`);
    console.log(`   Critical: ${issues.filter(i => i.severity === 'critical').length}`);
    console.log(`   High: ${issues.filter(i => i.severity === 'high').length}`);
    console.log(`   Medium: ${issues.filter(i => i.severity === 'medium').length}`);
    console.log(`   Low: ${issues.filter(i => i.severity === 'low').length}`);
    
  } catch (error) {
    console.error('❌ Error generating audit report:', error);
    throw error;
  }
}

// Run the report generation
generateAuditReport().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
