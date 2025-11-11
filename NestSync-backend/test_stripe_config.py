"""
Test script to verify Stripe configuration in development
Requirements: 10.1, 10.2, 10.3
"""

import os
import sys

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(__file__))

def test_stripe_config():
    """Test Stripe configuration"""
    print("=" * 60)
    print("Stripe Configuration Test")
    print("=" * 60)
    
    # Check environment variables
    print("\n1. Environment Variables:")
    print(f"   ENVIRONMENT: {os.getenv('ENVIRONMENT', 'not set')}")
    print(f"   STRIPE_PUBLISHABLE_KEY: {'set' if os.getenv('STRIPE_PUBLISHABLE_KEY') else 'NOT SET'}")
    print(f"   STRIPE_SECRET_KEY: {'set' if os.getenv('STRIPE_SECRET_KEY') else 'NOT SET'}")
    print(f"   STRIPE_WEBHOOK_SECRET: {'set' if os.getenv('STRIPE_WEBHOOK_SECRET') else 'NOT SET'}")
    
    # Check if keys are test keys
    pub_key = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
    secret_key = os.getenv('STRIPE_SECRET_KEY', '')
    
    print("\n2. Key Validation:")
    if pub_key.startswith('pk_test_'):
        print("   ✓ Using Stripe TEST publishable key (correct for development)")
    elif pub_key.startswith('pk_live_'):
        print("   ✗ WARNING: Using Stripe LIVE publishable key in development!")
    else:
        print("   ✗ ERROR: Invalid or missing publishable key")
    
    if secret_key.startswith('sk_test_'):
        print("   ✓ Using Stripe TEST secret key (correct for development)")
    elif secret_key.startswith('sk_live_'):
        print("   ✗ WARNING: Using Stripe LIVE secret key in development!")
    else:
        print("   ✗ ERROR: Invalid or missing secret key")
    
    # Try to import and initialize Stripe config
    print("\n3. Stripe Configuration Module:")
    try:
        from app.config.stripe import get_stripe_config
        config = get_stripe_config()
        print(f"   ✓ Stripe config initialized successfully")
        print(f"   - Development mode: {config.is_development}")
        print(f"   - Currency: {config.default_currency}")
        print(f"   - Country: {config.default_country}")
        print(f"   - Trial period: {config.trial_period_days} days")
    except ImportError as e:
        print(f"   ✗ Failed to import Stripe config: {e}")
        print("   Note: This is expected if stripe package is not installed")
    except Exception as e:
        print(f"   ✗ Error initializing Stripe config: {e}")
    
    # Check frontend config
    print("\n4. Frontend Configuration:")
    frontend_key = os.getenv('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY')
    if frontend_key:
        print(f"   ✓ Frontend publishable key is set")
        if frontend_key == pub_key:
            print(f"   ✓ Frontend and backend keys match")
        else:
            print(f"   ✗ WARNING: Frontend and backend keys don't match")
    else:
        print(f"   ✗ Frontend publishable key not set in environment")
    
    print("\n" + "=" * 60)
    print("Test Complete")
    print("=" * 60)

if __name__ == "__main__":
    test_stripe_config()
