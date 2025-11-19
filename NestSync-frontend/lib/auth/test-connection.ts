/**
 * Authentication Connection Test
 * Simple test to verify GraphQL connection and authentication flows
 */

import apolloClient from '../graphql/client';
import { secureLog } from '../utils/secureLogger';
import { HEALTH_CHECK_QUERY, API_INFO_QUERY } from '../graphql/queries';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export async function testGraphQLConnection(): Promise<TestResult> {
  try {
    if (__DEV__) {
      secureLog.info(' Testing GraphQL connection to backend...');
    }
    
    const { data } = await apolloClient.query({
      query: HEALTH_CHECK_QUERY,
      fetchPolicy: 'network-only',
    });

    if (data?.healthCheck) {
      return {
        success: true,
        message: 'GraphQL connection successful',
        details: { healthCheck: data.healthCheck },
      };
    } else {
      return {
        success: false,
        message: 'GraphQL connection failed - no health check response',
      };
    }
  } catch (error) {
    if (__DEV__) {
      secureLog.error(' GraphQL connection test failed:', error);
    }
    return {
      success: false,
      message: `GraphQL connection failed: ${error}`,
      details: error,
    };
  }
}

export async function testAPIInfo(): Promise<TestResult> {
  try {
    if (__DEV__) {
      secureLog.info(' Testing API info endpoint...');
    }
    
    const { data } = await apolloClient.query({
      query: API_INFO_QUERY,
      fetchPolicy: 'network-only',
    });

    if (data?.apiInfo) {
      return {
        success: true,
        message: 'API info retrieved successfully',
        details: { apiInfo: data.apiInfo },
      };
    } else {
      return {
        success: false,
        message: 'API info failed - no response',
      };
    }
  } catch (error) {
    if (__DEV__) {
      secureLog.error(' API info test failed:', error);
    }
    return {
      success: false,
      message: `API info failed: ${error}`,
      details: error,
    };
  }
}

export async function runAllTests(): Promise<{
  graphqlConnection: TestResult;
  apiInfo: TestResult;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    success: boolean;
  };
}> {
  if (__DEV__) {
    secureLog.info(' Running authentication system tests...');
  }
  
  const graphqlConnection = await testGraphQLConnection();
  const apiInfo = await testAPIInfo();
  
  const totalTests = 2;
  const passed = [graphqlConnection, apiInfo].filter(t => t.success).length;
  const failed = totalTests - passed;
  
  const summary = {
    totalTests,
    passed,
    failed,
    success: failed === 0,
  };
  
  if (__DEV__) {
    secureLog.info(' Test Summary:', summary);
  }
  
  return {
    graphqlConnection,
    apiInfo,
    summary,
  };
}

export default { testGraphQLConnection, testAPIInfo, runAllTests };