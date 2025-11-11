import requests
import time

BASE_URL = "http://localhost:8001/graphql"
TIMEOUT = 30
# Assume a valid token is obtained from a secure source or environment for authenticated requests
AUTH_TOKEN = "Bearer your_valid_auth_token_here"
HEADERS = {
    "Authorization": AUTH_TOKEN,
    "Content-Type": "application/json"
}

def test_analytics_dashboard_endpoints():
    try:
        # Query usage patterns
        query_usage_patterns = {
            "query": """
            query {
                analytics {
                    usagePatterns {
                        patternType
                        dataPoints {
                            date
                            value
                        }
                    }
                }
            }
            """
        }
        start_time = time.time()
        resp = requests.post(BASE_URL, json=query_usage_patterns, headers=HEADERS, timeout=TIMEOUT)
        duration = (time.time() - start_time) * 1000
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        result = resp.json()
        assert isinstance(result, dict) and result is not None, "Response JSON is None or not a dictionary"
        assert 'data' in result and result['data'] is not None, "Response 'data' field is missing or None"
        assert 'analytics' in result['data'] and result['data']['analytics'] is not None, "Response 'analytics' field missing or None"
        usage_patterns = result['data']['analytics']['usagePatterns']
        assert isinstance(usage_patterns, list)
        # Performance target: under 500ms
        assert duration < 500, f"Usage patterns query took {duration}ms, exceeding 500ms"

        # Query cost summaries
        query_cost_summaries = {
            "query": """
            query {
                analytics {
                    costSummaries {
                        totalCost
                        categoryBreakdown {
                            category
                            cost
                        }
                    }
                }
            }
            """
        }
        start_time = time.time()
        resp = requests.post(BASE_URL, json=query_cost_summaries, headers=HEADERS, timeout=TIMEOUT)
        duration = (time.time() - start_time) * 1000
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        result = resp.json()
        assert isinstance(result, dict) and result is not None, "Response JSON is None or not a dictionary"
        assert 'data' in result and result['data'] is not None, "Response 'data' field is missing or None"
        cost_summaries = result['data']['analytics']['costSummaries']
        assert 'totalCost' in cost_summaries
        assert isinstance(cost_summaries['totalCost'], (int, float))
        assert 'categoryBreakdown' in cost_summaries
        assert isinstance(cost_summaries['categoryBreakdown'], list)
        # Performance target
        assert duration < 500, f"Cost summaries query took {duration}ms, exceeding 500ms"

        # Query predictions
        query_predictions = {
            "query": """
            query {
                analytics {
                    predictions {
                        nextReorderDate
                        predictedSizes {
                            size
                            predictedUsage
                        }
                    }
                }
            }
            """
        }
        start_time = time.time()
        resp = requests.post(BASE_URL, json=query_predictions, headers=HEADERS, timeout=TIMEOUT)
        duration = (time.time() - start_time) * 1000
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        result = resp.json()
        assert isinstance(result, dict) and result is not None, "Response JSON is None or not a dictionary"
        assert 'data' in result and result['data'] is not None, "Response 'data' field is missing or None"
        predictions = result['data']['analytics']['predictions']
        assert 'nextReorderDate' in predictions
        assert isinstance(predictions['nextReorderDate'], str)
        assert 'predictedSizes' in predictions
        assert isinstance(predictions['predictedSizes'], list)
        # Performance check
        assert duration < 500, f"Predictions query took {duration}ms, exceeding 500ms"

        # Query insights
        query_insights = {
            "query": """
            query {
                analytics {
                    insights {
                        title
                        description
                        relevanceScore
                    }
                }
            }
            """
        }
        start_time = time.time()
        resp = requests.post(BASE_URL, json=query_insights, headers=HEADERS, timeout=TIMEOUT)
        duration = (time.time() - start_time) * 1000
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        result = resp.json()
        assert isinstance(result, dict) and result is not None, "Response JSON is None or not a dictionary"
        assert 'data' in result and result['data'] is not None, "Response 'data' field is missing or None"
        insights = result['data']['analytics']['insights']
        assert isinstance(insights, list)
        for insight in insights:
            assert 'title' in insight and isinstance(insight['title'], str)
            assert 'description' in insight and isinstance(insight['description'], str)
            assert 'relevanceScore' in insight and isinstance(insight['relevanceScore'], (int, float))
        # Performance check
        assert duration < 500, f"Insights query took {duration}ms, exceeding 500ms"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"


test_analytics_dashboard_endpoints()
