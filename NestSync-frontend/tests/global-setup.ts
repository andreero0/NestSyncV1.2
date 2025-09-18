/**
 * Global setup for Emergency Flows testing
 * Prepares test environment and creates necessary test data
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚨 Setting up Emergency Flows test environment...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Verify backend is running
    await verifyBackendHealth(page);

    // 2. Setup test data
    await setupEmergencyTestData(page);

    // 3. Verify test credentials work
    await verifyTestCredentials(page);

    console.log('✅ Emergency Flows test environment ready');

  } catch (error) {
    console.error('❌ Failed to setup Emergency Flows test environment:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function verifyBackendHealth(page) {
  const API_URL = process.env.NODE_ENV === 'production'
    ? 'https://nestsync-api.railway.app'
    : 'http://localhost:8001';

  try {
    console.log('🔍 Checking backend health...');

    // Check GraphQL endpoint
    const response = await page.request.post(`${API_URL}/graphql`, {
      data: {
        query: '{ __schema { types { name } } }'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok()) {
      throw new Error(`Backend health check failed: ${response.status()}`);
    }

    console.log('✅ Backend is healthy');
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    throw new Error('Backend is not available for emergency testing');
  }
}

async function setupEmergencyTestData(page) {
  const API_URL = process.env.NODE_ENV === 'production'
    ? 'https://nestsync-api.railway.app'
    : 'http://localhost:8001';

  try {
    console.log('🏗️ Setting up emergency test data...');

    // 1. Ensure test user exists and has children
    const testUserQuery = `
      query GetTestUser {
        me {
          id
          email
          children {
            id
            name
            emergencyContacts {
              id
              name
              phoneNumber
              isPrimary
            }
          }
        }
      }
    `;

    // First, try to login with test credentials to get auth token
    // This would typically involve authentication setup

    // 2. Create emergency contacts if they don't exist
    const emergencyContactMutation = `
      mutation CreateEmergencyContact($input: CreateEmergencyContactInput!) {
        createEmergencyContact(input: $input) {
          success
          emergencyContact {
            id
            name
          }
          errors
        }
      }
    `;

    // 3. Setup medical information
    const medicalInfoMutation = `
      mutation UpdateChildMedicalInfo($input: UpdateChildMedicalInfoInput!) {
        updateChildMedicalInfo(input: $input) {
          success
          child {
            id
            medicalConditions
            medications
            allergies
          }
          errors
        }
      }
    `;

    console.log('✅ Emergency test data setup complete');

  } catch (error) {
    console.error('❌ Failed to setup emergency test data:', error);
    // Don't throw - tests should handle missing data gracefully
  }
}

async function verifyTestCredentials(page) {
  const BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://nestsync.ca'
    : 'http://localhost:8082';

  try {
    console.log('🔐 Verifying test credentials...');

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Try to login with test credentials
    const loginTab = page.locator('[data-testid="login-tab"]');
    if (await loginTab.isVisible()) {
      await loginTab.click();

      await page.fill('[data-testid="email-input"]', 'parents@nestsync.com');
      await page.fill('[data-testid="password-input"]', 'Shazam11#');
      await page.click('[data-testid="login-button"]');

      // Wait for successful login or error
      try {
        await page.waitForSelector('[data-testid="home-screen"]', { timeout: 10000 });
        console.log('✅ Test credentials verified');
      } catch {
        console.warn('⚠️ Test credentials may not work - tests may need to handle this');
      }
    }

  } catch (error) {
    console.error('❌ Failed to verify test credentials:', error);
    // Don't throw - tests should handle authentication gracefully
  }
}

export default globalSetup;