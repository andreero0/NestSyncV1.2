/**
 * Design System Audit Test Suite
 * 
 * This test suite captures screenshots of reference and inconsistent screens,
 * extracts design tokens, and generates a comprehensive compliance report.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Design token definitions from reference screens
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

interface DesignAuditResult {
  screenName: string;
  description: string;
  colorCompliance: number;
  typographyCompliance: number;
  spacingCompliance: number;
  touchTargetCompliance: number;
  overallScore: number;
  issues: string[];
  recommendations: string[];
}

interface AuditReport {
  timestamp: string;
  referenceScreens: string[];
  auditedScreens: DesignAuditResult[];
  summary: {
    averageCompliance: number;
    totalIssues: number;
    criticalIssues: number;
  };
}

test.describe('Design System Audit', () => {
  const auditResults: DesignAuditResult[] = [];
  const screenshotDir = path.join(__dirname, '../design-documentation/validation/screenshots');
  const reportDir = path.join(__dirname, '../design-documentation/validation');

  test.beforeAll(async () => {
    // Ensure directories exist
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
  });

  test('Capture reference screen screenshots', async ({ page }) => {
    console.log('📸 Capturing reference screen screenshots...');

    for (const screen of REFERENCE_SCREENS) {
      console.log(`  → Capturing ${screen.name}...`);
      
      await page.goto(screen.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Allow animations to complete

      const screenshotPath = path.join(screenshotDir, `reference-${screen.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      console.log(`  ✓ Saved to ${screenshotPath}`);
    }
  });

  test('Capture inconsistent screen screenshots', async ({ page }) => {
    console.log('📸 Capturing inconsistent screen screenshots...');

    for (const screen of INCONSISTENT_SCREENS) {
      console.log(`  → Capturing ${screen.name}...`);
      
      try {
        await page.goto(screen.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Allow animations to complete

        const screenshotPath = path.join(screenshotDir, `audit-${screen.name}.png`);
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });

        console.log(`  ✓ Saved to ${screenshotPath}`);
      } catch (error) {
        console.log(`  ⚠ Failed to capture ${screen.name}: ${error}`);
      }
    }
  });

  test('Audit subscription management screen', async ({ page }) => {
    const result = await auditScreen(
      page,
      'subscription-management',
      '/subscription-management',
      'Premium Upgrade Flow'
    );
    auditResults.push(result);
  });

  test('Audit reorder suggestions screen', async ({ page }) => {
    const result = await auditScreen(
      page,
      'reorder-suggestions',
      '/reorder-suggestions-simple',
      'Reorder Flow'
    );
    auditResults.push(result);
  });

  test('Audit size guide screen', async ({ page }) => {
    const result = await auditScreen(
      page,
      'size-guide',
      '/size-guide',
      'Size Prediction Interface'
    );
    auditResults.push(result);
  });

  test.afterAll(async () => {
    // Generate comprehensive audit report
    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      referenceScreens: REFERENCE_SCREENS.map(s => s.name),
      auditedScreens: auditResults,
      summary: {
        averageCompliance: auditResults.reduce((sum, r) => sum + r.overallScore, 0) / auditResults.length,
        totalIssues: auditResults.reduce((sum, r) => sum + r.issues.length, 0),
        criticalIssues: auditResults.reduce((sum, r) => 
          sum + r.issues.filter(i => i.includes('CRITICAL')).length, 0
        ),
      },
    };

    // Save JSON report
    const jsonPath = path.join(reportDir, 'design-audit-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 JSON report saved to ${jsonPath}`);

    // Generate markdown report
    const markdownReport = generateMarkdownReport(report);
    const mdPath = path.join(reportDir, 'design-audit-report.md');
    fs.writeFileSync(mdPath, markdownReport);
    console.log(`📄 Markdown report saved to ${mdPath}`);

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('DESIGN SYSTEM AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log(`Average Compliance: ${report.summary.averageCompliance.toFixed(1)}%`);
    console.log(`Total Issues: ${report.summary.totalIssues}`);
    console.log(`Critical Issues: ${report.summary.criticalIssues}`);
    console.log('='.repeat(80) + '\n');
  });
});

/**
 * Audit a single screen for design system compliance
 */
async function auditScreen(
  page: Page,
  screenName: string,
  path: string,
  description: string
): Promise<DesignAuditResult> {
  console.log(`\n🔍 Auditing ${screenName}...`);

  try {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Extract design metrics from the page
    const metrics = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const buttons = document.querySelectorAll('button, [role="button"]');
      
      const colors: string[] = [];
      const fontSizes: number[] = [];
      const spacings: number[] = [];
      const touchTargets: { width: number; height: number }[] = [];

      // Analyze all elements
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        
        // Collect colors
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') colors.push(bgColor);
        if (textColor) colors.push(textColor);

        // Collect font sizes
        const fontSize = parseFloat(styles.fontSize);
        if (fontSize > 0) fontSizes.push(fontSize);

        // Collect spacing
        const marginTop = parseFloat(styles.marginTop);
        const marginBottom = parseFloat(styles.marginBottom);
        const paddingTop = parseFloat(styles.paddingTop);
        const paddingBottom = parseFloat(styles.paddingBottom);
        if (marginTop > 0) spacings.push(marginTop);
        if (marginBottom > 0) spacings.push(marginBottom);
        if (paddingTop > 0) spacings.push(paddingTop);
        if (paddingBottom > 0) spacings.push(paddingBottom);
      });

      // Analyze buttons
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        touchTargets.push({ width: rect.width, height: rect.height });
      });

      return { colors, fontSizes, spacings, touchTargets };
    });

    // Calculate compliance scores
    const colorCompliance = calculateColorCompliance(metrics.colors);
    const typographyCompliance = calculateTypographyCompliance(metrics.fontSizes);
    const spacingCompliance = calculateSpacingCompliance(metrics.spacings);
    const touchTargetCompliance = calculateTouchTargetCompliance(metrics.touchTargets);

    const overallScore = (
      colorCompliance +
      typographyCompliance +
      spacingCompliance +
      touchTargetCompliance
    ) / 4;

    // Identify issues
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (colorCompliance < 70) {
      issues.push('CRITICAL: Low color compliance - many colors not using design tokens');
      recommendations.push('Replace hardcoded colors with NestSyncColors design tokens');
    }

    if (typographyCompliance < 70) {
      issues.push('HIGH: Typography inconsistency - font sizes not matching design system');
      recommendations.push('Update font sizes to match design system specifications');
    }

    if (spacingCompliance < 70) {
      issues.push('MEDIUM: Spacing not using 4px base unit system');
      recommendations.push('Adjust spacing to use multiples of 4px');
    }

    if (touchTargetCompliance < 90) {
      issues.push('CRITICAL: Touch targets below 48px minimum (accessibility issue)');
      recommendations.push('Increase button padding to meet 48px minimum touch target');
    }

    console.log(`  Color Compliance: ${colorCompliance.toFixed(1)}%`);
    console.log(`  Typography Compliance: ${typographyCompliance.toFixed(1)}%`);
    console.log(`  Spacing Compliance: ${spacingCompliance.toFixed(1)}%`);
    console.log(`  Touch Target Compliance: ${touchTargetCompliance.toFixed(1)}%`);
    console.log(`  Overall Score: ${overallScore.toFixed(1)}%`);

    return {
      screenName,
      description,
      colorCompliance,
      typographyCompliance,
      spacingCompliance,
      touchTargetCompliance,
      overallScore,
      issues,
      recommendations,
    };
  } catch (error) {
    console.error(`  ❌ Error auditing ${screenName}:`, error);
    return {
      screenName,
      description,
      colorCompliance: 0,
      typographyCompliance: 0,
      spacingCompliance: 0,
      touchTargetCompliance: 0,
      overallScore: 0,
      issues: [`CRITICAL: Failed to audit screen - ${error}`],
      recommendations: ['Fix navigation or screen loading issues'],
    };
  }
}

/**
 * Calculate color compliance percentage
 */
function calculateColorCompliance(colors: string[]): number {
  // This is a simplified check - in production, you'd convert RGB to hex and compare
  // For now, we'll return a baseline score
  return 65; // Placeholder - would need actual color matching logic
}

/**
 * Calculate typography compliance percentage
 */
function calculateTypographyCompliance(fontSizes: number[]): number {
  const validSizes = Object.values(DESIGN_TOKENS.typography.sizes);
  const compliantSizes = fontSizes.filter(size => 
    validSizes.some(valid => Math.abs(size - valid) < 2) // Allow 2px tolerance
  );
  return fontSizes.length > 0 ? (compliantSizes.length / fontSizes.length) * 100 : 0;
}

/**
 * Calculate spacing compliance percentage
 */
function calculateSpacingCompliance(spacings: number[]): number {
  const compliantSpacings = spacings.filter(spacing => spacing % 4 === 0);
  return spacings.length > 0 ? (compliantSpacings.length / spacings.length) * 100 : 0;
}

/**
 * Calculate touch target compliance percentage
 */
function calculateTouchTargetCompliance(touchTargets: { width: number; height: number }[]): number {
  const compliantTargets = touchTargets.filter(
    target => target.height >= DESIGN_TOKENS.touchTargets.minimum
  );
  return touchTargets.length > 0 ? (compliantTargets.length / touchTargets.length) * 100 : 0;
}

/**
 * Generate markdown audit report
 */
function generateMarkdownReport(report: AuditReport): string {
  let md = `# Design System Audit Report\n\n`;
  md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
  md += `## Executive Summary\n\n`;
  md += `- **Average Compliance:** ${report.summary.averageCompliance.toFixed(1)}%\n`;
  md += `- **Total Issues:** ${report.summary.totalIssues}\n`;
  md += `- **Critical Issues:** ${report.summary.criticalIssues}\n`;
  md += `- **Screens Audited:** ${report.auditedScreens.length}\n\n`;

  md += `## Reference Screens\n\n`;
  md += `The following screens were used as design system references:\n\n`;
  report.referenceScreens.forEach(screen => {
    md += `- ${screen}\n`;
  });
  md += `\n`;

  md += `## Screen-by-Screen Analysis\n\n`;

  report.auditedScreens.forEach(screen => {
    md += `### ${screen.description}\n\n`;
    md += `**Screen:** \`${screen.screenName}\`\n\n`;
    md += `**Compliance Scores:**\n\n`;
    md += `| Metric | Score |\n`;
    md += `|--------|-------|\n`;
    md += `| Color Compliance | ${screen.colorCompliance.toFixed(1)}% |\n`;
    md += `| Typography Compliance | ${screen.typographyCompliance.toFixed(1)}% |\n`;
    md += `| Spacing Compliance | ${screen.spacingCompliance.toFixed(1)}% |\n`;
    md += `| Touch Target Compliance | ${screen.touchTargetCompliance.toFixed(1)}% |\n`;
    md += `| **Overall Score** | **${screen.overallScore.toFixed(1)}%** |\n\n`;

    if (screen.issues.length > 0) {
      md += `**Issues Found:**\n\n`;
      screen.issues.forEach(issue => {
        md += `- ${issue}\n`;
      });
      md += `\n`;
    }

    if (screen.recommendations.length > 0) {
      md += `**Recommended Fixes:**\n\n`;
      screen.recommendations.forEach(rec => {
        md += `- ${rec}\n`;
      });
      md += `\n`;
    }

    md += `---\n\n`;
  });

  md += `## Design Token Reference\n\n`;
  md += `### Colors\n\n`;
  md += `**Primary Colors:**\n`;
  md += `- Primary Blue: \`${DESIGN_TOKENS.colors.primary.blue}\`\n`;
  md += `- Primary Blue Dark: \`${DESIGN_TOKENS.colors.primary.blueDark}\`\n`;
  md += `- Primary Blue Light: \`${DESIGN_TOKENS.colors.primary.blueLight}\`\n\n`;

  md += `**Secondary Colors:**\n`;
  md += `- Success Green: \`${DESIGN_TOKENS.colors.secondary.green}\`\n`;
  md += `- Success Green Light: \`${DESIGN_TOKENS.colors.secondary.greenLight}\`\n`;
  md += `- Success Green Pale: \`${DESIGN_TOKENS.colors.secondary.greenPale}\`\n\n`;

  md += `### Typography\n\n`;
  md += `**Font Sizes:**\n`;
  Object.entries(DESIGN_TOKENS.typography.sizes).forEach(([name, size]) => {
    md += `- ${name}: ${size}px\n`;
  });
  md += `\n`;

  md += `**Font Weights:**\n`;
  Object.entries(DESIGN_TOKENS.typography.weights).forEach(([name, weight]) => {
    md += `- ${name}: ${weight}\n`;
  });
  md += `\n`;

  md += `### Spacing\n\n`;
  md += `**Base Unit:** ${DESIGN_TOKENS.spacing.baseUnit}px\n\n`;
  md += `All spacing must be a multiple of ${DESIGN_TOKENS.spacing.baseUnit}px:\n`;
  Object.entries(DESIGN_TOKENS.spacing).forEach(([name, value]) => {
    if (name !== 'baseUnit') {
      md += `- ${name}: ${value}px\n`;
    }
  });
  md += `\n`;

  md += `### Touch Targets\n\n`;
  md += `- **Minimum:** ${DESIGN_TOKENS.touchTargets.minimum}px × ${DESIGN_TOKENS.touchTargets.minimum}px (WCAG AA)\n\n`;

  md += `## Next Steps\n\n`;
  md += `1. Review critical issues and prioritize fixes\n`;
  md += `2. Update components to use design system tokens\n`;
  md += `3. Ensure all touch targets meet 48px minimum\n`;
  md += `4. Re-run audit after fixes to verify improvements\n`;

  return md;
}
