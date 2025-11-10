/**
 * Design System Audit Script
 * 
 * Uses Playwright MCP to capture screenshots and analyze design system compliance
 * 
 * Usage: node scripts/design-audit.js
 */

const fs = require('fs');
const path = require('path');

// Design token definitions
const DESIGN_TOKENS = {
  colors: {
    primary: {
      blue: '#0891B2',
      blueDark: '#0E7490',
      blueLight: '#E0F2FE',
    },
    secondary: {
      green: '#059669',
      greenLight: '#D1FAE5',
      greenPale: '#F0FDF4',
    },
    accent: {
      orange: '#EA580C',
      amber: '#D97706',
      purple: '#7C3AED',
    },
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  typography: {
    sizes: {
      caption: 11,
      small: 12,
      body: 14,
      subtitle: 16,
      title: 20,
      largeTitle: 28,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  spacing: {
    baseUnit: 4,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
  touchTargets: {
    minimum: 48,
  },
};

// Screen configurations
const REFERENCE_SCREENS = [
  { name: 'home', path: '/', description: 'Dashboard Home Screen' },
  { name: 'settings', path: '/profile-settings', description: 'Settings Screen' },
];

const INCONSISTENT_SCREENS = [
  { name: 'subscription-management', path: '/subscription-management', description: 'Premium Upgrade Flow' },
  { name: 'reorder-suggestions', path: '/reorder-suggestions-simple', description: 'Reorder Flow' },
  { name: 'size-guide', path: '/size-guide', description: 'Size Prediction Interface' },
];

// Output directories
const SCREENSHOT_DIR = path.join(__dirname, '../design-documentation/validation/screenshots');
const REPORT_DIR = path.join(__dirname, '../design-documentation/validation');

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
}

// Generate audit report
function generateAuditReport() {
  console.log('\n' + '='.repeat(80));
  console.log('DESIGN SYSTEM AUDIT REPORT');
  console.log('='.repeat(80));
  console.log('\nThis script provides instructions for conducting a design system audit.');
  console.log('Screenshots should be captured and analyzed manually or with Playwright MCP.\n');

  const report = {
    timestamp: new Date().toISOString(),
    referenceScreens: REFERENCE_SCREENS,
    inconsistentScreens: INCONSISTENT_SCREENS,
    designTokens: DESIGN_TOKENS,
    instructions: {
      step1: 'Capture screenshots of reference screens (home, settings)',
      step2: 'Capture screenshots of inconsistent screens (subscription, reorder, size guide)',
      step3: 'Extract design tokens from reference screens',
      step4: 'Compare inconsistent screens against design tokens',
      step5: 'Calculate compliance scores for each metric',
      step6: 'Document specific visual gaps and inconsistencies',
    },
    complianceMetrics: {
      colorCompliance: 'Percentage of colors matching design tokens',
      typographyCompliance: 'Percentage of text using correct sizes/weights',
      spacingCompliance: 'Percentage of spacing using 4px base unit',
      touchTargetCompliance: 'Percentage of buttons meeting 48px minimum',
    },
  };

  // Save JSON report
  const jsonPath = path.join(REPORT_DIR, 'design-audit-config.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`✓ Configuration saved to: ${jsonPath}`);

  // Generate markdown instructions
  const markdown = generateMarkdownInstructions(report);
  const mdPath = path.join(REPORT_DIR, 'design-audit-instructions.md');
  fs.writeFileSync(mdPath, markdown);
  console.log(`✓ Instructions saved to: ${mdPath}`);

  console.log('\n' + '='.repeat(80));
  console.log('NEXT STEPS');
  console.log('='.repeat(80));
  console.log('\n1. Use Playwright MCP to capture screenshots:');
  console.log('   - Navigate to each screen URL');
  console.log('   - Take full-page screenshots');
  console.log('   - Save to design-documentation/validation/screenshots/');
  console.log('\n2. Analyze screenshots manually or with automated tools');
  console.log('\n3. Document findings in design-audit-report.md');
  console.log('\n' + '='.repeat(80) + '\n');
}

// Generate markdown instructions
function generateMarkdownInstructions(report) {
  let md = `# Design System Audit Instructions\n\n`;
  md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
  
  md += `## Overview\n\n`;
  md += `This document provides instructions for conducting a comprehensive design system audit `;
  md += `of the NestSync application. The audit compares inconsistent screens against reference `;
  md += `screens to identify design token violations and accessibility issues.\n\n`;

  md += `## Reference Screens (Good Design)\n\n`;
  md += `These screens demonstrate proper design system implementation:\n\n`;
  report.referenceScreens.forEach(screen => {
    md += `### ${screen.description}\n`;
    md += `- **Path:** \`${screen.path}\`\n`;
    md += `- **Screenshot:** \`reference-${screen.name}.png\`\n\n`;
  });

  md += `## Screens to Audit (Inconsistent Design)\n\n`;
  md += `These screens need to be aligned with the design system:\n\n`;
  report.inconsistentScreens.forEach(screen => {
    md += `### ${screen.description}\n`;
    md += `- **Path:** \`${screen.path}\`\n`;
    md += `- **Screenshot:** \`audit-${screen.name}.png\`\n\n`;
  });

  md += `## Design Token Reference\n\n`;
  md += `### Colors\n\n`;
  md += `**Primary Colors:**\n`;
  Object.entries(report.designTokens.colors.primary).forEach(([name, value]) => {
    md += `- ${name}: \`${value}\`\n`;
  });
  md += `\n**Secondary Colors:**\n`;
  Object.entries(report.designTokens.colors.secondary).forEach(([name, value]) => {
    md += `- ${name}: \`${value}\`\n`;
  });
  md += `\n**Accent Colors:**\n`;
  Object.entries(report.designTokens.colors.accent).forEach(([name, value]) => {
    md += `- ${name}: \`${value}\`\n`;
  });
  md += `\n`;

  md += `### Typography\n\n`;
  md += `**Font Sizes:**\n`;
  Object.entries(report.designTokens.typography.sizes).forEach(([name, size]) => {
    md += `- ${name}: ${size}px\n`;
  });
  md += `\n**Font Weights:**\n`;
  Object.entries(report.designTokens.typography.weights).forEach(([name, weight]) => {
    md += `- ${name}: ${weight}\n`;
  });
  md += `\n`;

  md += `### Spacing\n\n`;
  md += `**Base Unit:** ${report.designTokens.spacing.baseUnit}px\n\n`;
  md += `All spacing must be a multiple of ${report.designTokens.spacing.baseUnit}px:\n`;
  Object.entries(report.designTokens.spacing).forEach(([name, value]) => {
    if (name !== 'baseUnit') {
      md += `- ${name}: ${value}px (${value / report.designTokens.spacing.baseUnit} units)\n`;
    }
  });
  md += `\n`;

  md += `### Border Radius\n\n`;
  Object.entries(report.designTokens.borderRadius).forEach(([name, value]) => {
    md += `- ${name}: ${value}px\n`;
  });
  md += `\n`;

  md += `### Touch Targets\n\n`;
  md += `- **Minimum:** ${report.designTokens.touchTargets.minimum}px × ${report.designTokens.touchTargets.minimum}px (WCAG AA)\n\n`;

  md += `## Audit Process\n\n`;
  md += `### Step 1: Capture Screenshots\n\n`;
  md += `Use Playwright MCP or manual browser screenshots to capture:\n\n`;
  md += `1. **Reference Screens:**\n`;
  report.referenceScreens.forEach(screen => {
    md += `   - Navigate to \`${screen.path}\`\n`;
    md += `   - Save screenshot as \`reference-${screen.name}.png\`\n`;
  });
  md += `\n2. **Inconsistent Screens:**\n`;
  report.inconsistentScreens.forEach(screen => {
    md += `   - Navigate to \`${screen.path}\`\n`;
    md += `   - Save screenshot as \`audit-${screen.name}.png\`\n`;
  });
  md += `\n`;

  md += `### Step 2: Extract Design Tokens\n\n`;
  md += `From reference screens, document:\n`;
  md += `- Primary button colors, typography, spacing\n`;
  md += `- Card styling (background, border, shadow, radius)\n`;
  md += `- Text hierarchy (sizes, weights, colors)\n`;
  md += `- Spacing patterns (margins, padding)\n`;
  md += `- Touch target sizes\n\n`;

  md += `### Step 3: Analyze Inconsistent Screens\n\n`;
  md += `For each inconsistent screen, compare against design tokens:\n\n`;
  md += `**Color Compliance:**\n`;
  md += `- Count elements using design token colors vs hardcoded colors\n`;
  md += `- Calculate percentage: (compliant / total) × 100\n\n`;

  md += `**Typography Compliance:**\n`;
  md += `- Count text elements using design system sizes/weights\n`;
  md += `- Calculate percentage: (compliant / total) × 100\n\n`;

  md += `**Spacing Compliance:**\n`;
  md += `- Count spacing values that are multiples of 4px\n`;
  md += `- Calculate percentage: (compliant / total) × 100\n\n`;

  md += `**Touch Target Compliance:**\n`;
  md += `- Count buttons/interactive elements ≥ 48px height\n`;
  md += `- Calculate percentage: (compliant / total) × 100\n\n`;

  md += `**Overall Score:**\n`;
  md += `- Average of all four compliance metrics\n\n`;

  md += `### Step 4: Document Issues\n\n`;
  md += `For each screen, document:\n`;
  md += `- Specific elements not using design tokens\n`;
  md += `- Hardcoded values that should use tokens\n`;
  md += `- Touch targets below 48px minimum\n`;
  md += `- Spacing not using 4px base unit\n\n`;

  md += `### Step 5: Generate Recommendations\n\n`;
  md += `For each issue, provide:\n`;
  md += `- Specific fix (e.g., "Replace #3B82F6 with NestSyncColors.primary.blue")\n`;
  md += `- Priority (Critical, High, Medium, Low)\n`;
  md += `- Estimated effort\n\n`;

  md += `## Report Template\n\n`;
  md += `Use this template for the final audit report:\n\n`;
  md += `\`\`\`markdown\n`;
  md += `# Design System Audit Report\n\n`;
  md += `## Executive Summary\n`;
  md += `- Average Compliance: X%\n`;
  md += `- Total Issues: X\n`;
  md += `- Critical Issues: X\n\n`;
  md += `## [Screen Name]\n`;
  md += `**Compliance Scores:**\n`;
  md += `- Color: X%\n`;
  md += `- Typography: X%\n`;
  md += `- Spacing: X%\n`;
  md += `- Touch Targets: X%\n`;
  md += `- Overall: X%\n\n`;
  md += `**Issues:**\n`;
  md += `1. [Issue description]\n\n`;
  md += `**Recommendations:**\n`;
  md += `1. [Fix description]\n`;
  md += `\`\`\`\n\n`;

  md += `## Compliance Thresholds\n\n`;
  md += `- **Excellent:** 90-100% compliance\n`;
  md += `- **Good:** 75-89% compliance\n`;
  md += `- **Needs Improvement:** 60-74% compliance\n`;
  md += `- **Critical:** <60% compliance\n\n`;

  md += `## Next Steps\n\n`;
  md += `1. Complete screenshot capture for all screens\n`;
  md += `2. Analyze each screen against design tokens\n`;
  md += `3. Calculate compliance scores\n`;
  md += `4. Document issues and recommendations\n`;
  md += `5. Generate final audit report\n`;
  md += `6. Prioritize fixes based on compliance scores\n`;

  return md;
}

// Main execution
console.log('🎨 Design System Audit Script\n');
ensureDirectories();
generateAuditReport();
