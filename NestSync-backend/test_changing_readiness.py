#!/usr/bin/env python3
"""
Test script for the "Changing Readiness" calculation system
Tests the calculate_changes_ready function with various scenarios
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.graphql.inventory_resolvers import calculate_changes_ready

def test_changing_readiness():
    print("Testing Changing Readiness Calculation System")
    print("=" * 50)
    
    # Test Case 1: Normal scenario - both supplies available
    print("\n1. Normal scenario: 100 diapers, 200 wipes")
    result = calculate_changes_ready(100, 200, 4.0)
    print(f"   Expected: 50 changes (limited by wipes: 200/4=50)")
    print(f"   Actual: {result} changes")
    assert result == 50, f"Expected 50, got {result}"
    
    # Test Case 2: Diaper-limited scenario  
    print("\n2. Diaper-limited scenario: 30 diapers, 200 wipes")
    result = calculate_changes_ready(30, 200, 4.0)
    print(f"   Expected: 30 changes (limited by diapers)")
    print(f"   Actual: {result} changes")
    assert result == 30, f"Expected 30, got {result}"
    
    # Test Case 3: Wipes-limited scenario
    print("\n3. Wipes-limited scenario: 100 diapers, 80 wipes")
    result = calculate_changes_ready(100, 80, 4.0)
    print(f"   Expected: 20 changes (limited by wipes: 80/4=20)")
    print(f"   Actual: {result} changes") 
    assert result == 20, f"Expected 20, got {result}"
    
    # Test Case 4: No diapers available
    print("\n4. No diapers scenario: 0 diapers, 100 wipes")
    result = calculate_changes_ready(0, 100, 4.0)
    print(f"   Expected: 0 changes (no diapers)")
    print(f"   Actual: {result} changes")
    assert result == 0, f"Expected 0, got {result}"
    
    # Test Case 5: No wipes available  
    print("\n5. No wipes scenario: 50 diapers, 0 wipes")
    result = calculate_changes_ready(50, 0, 4.0)
    print(f"   Expected: 0 changes (no wipes)")
    print(f"   Actual: {result} changes")
    assert result == 0, f"Expected 0, got {result}"
    
    # Test Case 6: Low wipes scenario (fractional result)
    print("\n6. Low wipes scenario: 50 diapers, 15 wipes")
    result = calculate_changes_ready(50, 15, 4.0)
    print(f"   Expected: 3 changes (limited by wipes: 15/4=3.75, floored to 3)")
    print(f"   Actual: {result} changes")
    assert result == 3, f"Expected 3, got {result}"
    
    # Test Case 7: Different wipes per change ratio
    print("\n7. Different ratio: 50 diapers, 50 wipes, 2.5 wipes per change")
    result = calculate_changes_ready(50, 50, 2.5)
    print(f"   Expected: 20 changes (limited by wipes: 50/2.5=20)")
    print(f"   Actual: {result} changes")
    assert result == 20, f"Expected 20, got {result}"
    
    # Test Case 8: Real-world scenario from logs (524 diapers, assuming no wipes)
    print("\n8. Real-world scenario: 524 diapers, 0 wipes")
    result = calculate_changes_ready(524, 0, 4.0)
    print(f"   Expected: 0 changes (no wipes)")
    print(f"   Actual: {result} changes")
    assert result == 0, f"Expected 0, got {result}"
    
    # Test Case 9: Real-world scenario with balanced supplies
    print("\n9. Balanced supplies: 524 diapers, 2096 wipes")
    result = calculate_changes_ready(524, 2096, 4.0)
    print(f"   Expected: 524 changes (both equal: 2096/4=524)")
    print(f"   Actual: {result} changes")
    assert result == 524, f"Expected 524, got {result}"
    
    print("\n" + "=" * 50)
    print("All tests passed! Changing Readiness calculation is working correctly.")
    print("This system will transform '524 Diapers Left' → 'Ready for X Changes'")

if __name__ == "__main__":
    test_changing_readiness()