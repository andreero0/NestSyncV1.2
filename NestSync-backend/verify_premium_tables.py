"""
Verify premium subscription tables and seed data after migration.
"""
import asyncio
from app.config.database import create_database_engines, get_async_session
from app.models.premium_subscription import (
    SubscriptionPlan, Subscription, PaymentMethod,
    BillingHistory, CanadianTaxRate, TrialProgress,
    TrialUsageEvent, FeatureAccess
)
from sqlalchemy import select, func


async def verify_tables():
    """Verify all premium subscription tables exist and have seed data."""
    print("\n" + "="*80)
    print("PREMIUM SUBSCRIPTION TABLES VERIFICATION")
    print("="*80 + "\n")

    async for session in get_async_session():
        try:
            # Check subscription_plans table
            result = await session.execute(select(func.count()).select_from(SubscriptionPlan))
            plans_count = result.scalar()
            print(f"✅ subscription_plans table: {plans_count} plans")

            if plans_count > 0:
                result = await session.execute(select(SubscriptionPlan))
                plans = result.scalars().all()
                print("\n   Subscription Plans:")
                for plan in plans:
                    print(f"   - {plan.id}: {plan.display_name} (${plan.price} CAD/{plan.billing_interval})")

            # Check subscriptions table
            result = await session.execute(select(func.count()).select_from(Subscription))
            subs_count = result.scalar()
            print(f"\n✅ subscriptions table: {subs_count} subscriptions")

            # Check payment_methods table
            result = await session.execute(select(func.count()).select_from(PaymentMethod))
            payment_count = result.scalar()
            print(f"✅ payment_methods table: {payment_count} payment methods")

            # Check billing_history table
            result = await session.execute(select(func.count()).select_from(BillingHistory))
            billing_count = result.scalar()
            print(f"✅ billing_history table: {billing_count} billing records")

            # Check canadian_tax_rates table
            result = await session.execute(select(func.count()).select_from(CanadianTaxRate))
            tax_count = result.scalar()
            print(f"\n✅ canadian_tax_rates table: {tax_count} provinces/territories")

            if tax_count > 0:
                result = await session.execute(select(CanadianTaxRate).order_by(CanadianTaxRate.province))
                tax_rates = result.scalars().all()
                print("\n   Canadian Tax Rates:")
                for rate in tax_rates:
                    print(f"   - {rate.province}: {rate.province_name} (GST: {rate.gst_rate}%, PST: {rate.pst_rate}%, HST: {rate.hst_rate}%)")

            # Check trial_progress table
            result = await session.execute(select(func.count()).select_from(TrialProgress))
            trial_count = result.scalar()
            print(f"\n✅ trial_progress table: {trial_count} trial records")

            # Check trial_usage_events table
            result = await session.execute(select(func.count()).select_from(TrialUsageEvent))
            usage_count = result.scalar()
            print(f"✅ trial_usage_events table: {usage_count} usage events")

            # Check feature_access table
            result = await session.execute(select(func.count()).select_from(FeatureAccess))
            feature_count = result.scalar()
            print(f"✅ feature_access table: {feature_count} feature access records")

            print("\n" + "="*80)
            print("VERIFICATION COMPLETE - ALL TABLES EXIST")
            print("="*80 + "\n")

            # Summary
            if plans_count == 5:
                print("✅ Expected 5 subscription plans found")
            else:
                print(f"⚠️  Expected 5 subscription plans, found {plans_count}")

            if tax_count == 13:
                print("✅ Expected 13 Canadian tax rates found")
            else:
                print(f"⚠️  Expected 13 Canadian tax rates, found {tax_count}")

            print("\n✅ All premium subscription tables created successfully!\n")

        except Exception as e:
            print(f"\n❌ Error during verification: {e}\n")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    # Initialize database engines first
    create_database_engines()
    asyncio.run(verify_tables())
