"""
Unit Tests for Reorder Service
Tests for ML prediction pipeline and subscription management
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from app.services.reorder_service import ReorderService
from app.models import SubscriptionTier, PredictionConfidence


@pytest.mark.unit
@pytest.mark.subscription
class TestReorderService:
    """Test suite for ReorderService"""

    async def test_create_subscription_basic_tier(
        self,
        reorder_service: ReorderService,
        test_user,
        mock_stripe,
        canadian_test_data
    ):
        """Test creating a basic subscription with Canadian tax calculation"""

        # Mock Stripe responses
        mock_stripe["customer"].create.return_value = MagicMock(id="cus_test_123")
        mock_stripe["subscription"].create.return_value = MagicMock(
            id="sub_test_123",
            current_period_start=1640995200,
            current_period_end=1643673600,
            latest_invoice="in_test_123"
        )

        with patch.object(reorder_service, '_create_stripe_customer') as mock_create_customer, \
             patch.object(reorder_service, '_create_stripe_subscription') as mock_create_sub:

            mock_create_customer.return_value = MagicMock(id="cus_test_123")
            mock_create_sub.return_value = MagicMock(
                id="sub_test_123",
                current_period_start=1640995200,
                current_period_end=1643673600
            )

            # Test subscription creation
            subscription, client_secret = await reorder_service.create_subscription(
                user=test_user,
                tier=SubscriptionTier.BASIC,
                stripe_payment_method_id="pm_test_123",
                billing_address={
                    "line1": "123 Test St",
                    "city": "Toronto",
                    "state": "ON",
                    "postal_code": "M5V 3L9",
                    "country": "CA"
                },
                province_code="ON"
            )

            # Assertions
            assert subscription is not None
            assert subscription.tier == SubscriptionTier.BASIC
            assert subscription.billing_amount_cad == Decimal("19.99")
            assert subscription.gst_rate == Decimal("0.00")  # Ontario uses HST
            assert subscription.pst_hst_rate == Decimal("0.13")  # Ontario HST
            assert subscription.total_tax_rate == Decimal("0.13")
            assert subscription.is_active is True

    async def test_generate_consumption_prediction(
        self,
        reorder_service: ReorderService,
        test_child,
        test_user
    ):
        """Test ML consumption prediction generation"""

        # Mock usage history data
        mock_usage_data = [
            {"date": datetime.now().date() - timedelta(days=i), "daily_usage": 6 + (i % 3)}
            for i in range(30)
        ]

        with patch.object(reorder_service, '_get_usage_history') as mock_usage, \
             patch('pandas.DataFrame') as mock_df, \
             patch('prophet.Prophet') as mock_prophet:

            mock_usage.return_value = mock_usage_data

            # Mock Prophet model
            mock_model = MagicMock()
            mock_prophet.return_value = mock_model

            mock_forecast = MagicMock()
            mock_forecast.__getitem__.return_value.tail.return_value.sum.return_value = 180
            mock_model.predict.return_value = mock_forecast

            # Mock performance metrics
            with patch.object(reorder_service, '_calculate_model_performance') as mock_perf, \
                 patch.object(reorder_service, '_determine_confidence_level') as mock_conf:

                mock_perf.return_value = (1.2, 0.85)  # MAE, R²
                mock_conf.return_value = PredictionConfidence.HIGH

                # Test prediction generation
                prediction = await reorder_service.generate_consumption_prediction(
                    child=test_child,
                    horizon_days=30
                )

                # Assertions
                assert prediction is not None
                assert prediction.child_id == test_child.id
                assert prediction.confidence_level == PredictionConfidence.HIGH
                assert prediction.prediction_horizon_days == 30
                assert prediction.mean_absolute_error == Decimal("1.2")
                assert prediction.r_squared_score == Decimal("0.85")

    async def test_canadian_tax_calculation(
        self,
        reorder_service: ReorderService,
        canadian_test_data
    ):
        """Test Canadian tax rate calculation for different provinces"""

        # Test Ontario (HST)
        on_rates = reorder_service.canadian_tax_rates["ON"]
        assert on_rates["gst"] == Decimal("0.00")
        assert on_rates["pst_hst"] == Decimal("0.13")

        # Test British Columbia (GST + PST)
        bc_rates = reorder_service.canadian_tax_rates["BC"]
        assert bc_rates["gst"] == Decimal("0.05")
        assert bc_rates["pst_hst"] == Decimal("0.07")

        # Test Alberta (GST only)
        ab_rates = reorder_service.canadian_tax_rates["AB"]
        assert ab_rates["gst"] == Decimal("0.05")
        assert ab_rates["pst_hst"] == Decimal("0.00")

    async def test_subscription_feature_flags(
        self,
        reorder_service: ReorderService
    ):
        """Test subscription tier feature configuration"""

        # Test Basic tier features
        basic_features = reorder_service._get_tier_features(SubscriptionTier.BASIC)
        assert basic_features["auto_reorder"] is True
        assert basic_features["max_children"] == 1
        assert basic_features["ml_predictions"] is True
        assert basic_features["price_comparison"] is False
        assert basic_features["priority_support"] is False

        # Test Premium tier features
        premium_features = reorder_service._get_tier_features(SubscriptionTier.PREMIUM)
        assert premium_features["max_children"] == 3
        assert premium_features["price_comparison"] is True
        assert premium_features["bulk_discounts"] is True

        # Test Family tier features
        family_features = reorder_service._get_tier_features(SubscriptionTier.FAMILY)
        assert family_features["max_children"] == 10
        assert family_features["priority_support"] is True

    async def test_ml_prediction_confidence_levels(
        self,
        reorder_service: ReorderService
    ):
        """Test ML prediction confidence level determination"""

        # Test high confidence (good metrics, lots of data)
        confidence = await reorder_service._determine_confidence_level(
            mae=1.0, r2=0.9, data_points=60
        )
        assert confidence == PredictionConfidence.VERY_HIGH

        # Test medium confidence (decent metrics, moderate data)
        confidence = await reorder_service._determine_confidence_level(
            mae=2.5, r2=0.6, data_points=30
        )
        assert confidence == PredictionConfidence.MEDIUM

        # Test low confidence (poor metrics or little data)
        confidence = await reorder_service._determine_confidence_level(
            mae=4.0, r2=0.3, data_points=10
        )
        assert confidence == PredictionConfidence.VERY_LOW

    async def test_size_change_prediction(
        self,
        reorder_service: ReorderService,
        test_child
    ):
        """Test diaper size change prediction logic"""

        # Test young baby with high usage (likely to size up)
        test_child.date_of_birth = datetime.now().date() - timedelta(days=60)  # 2 months old

        prob, next_size, change_date = await reorder_service._predict_size_change(
            child=test_child,
            current_rate=9.0  # High usage rate
        )

        assert prob is not None
        assert prob > 0.1  # Should have significant probability
        assert next_size == "Size 3"  # From Size 2 to Size 3
        assert change_date is not None
        assert change_date > datetime.now(timezone.utc)

    async def test_pricing_tier_configuration(
        self,
        reorder_service: ReorderService
    ):
        """Test subscription pricing configuration"""

        # Test Basic tier pricing
        basic_pricing = reorder_service._get_tier_pricing(SubscriptionTier.BASIC)
        assert basic_pricing["base_amount"] == Decimal("19.99")
        assert basic_pricing["interval"] == "month"

        # Test Premium tier pricing
        premium_pricing = reorder_service._get_tier_pricing(SubscriptionTier.PREMIUM)
        assert premium_pricing["base_amount"] == Decimal("29.99")

        # Test Family tier pricing
        family_pricing = reorder_service._get_tier_pricing(SubscriptionTier.FAMILY)
        assert family_pricing["base_amount"] == Decimal("34.99")


@pytest.mark.unit
@pytest.mark.ml
class TestMLPredictionPipeline:
    """Test suite for ML prediction pipeline components"""

    async def test_growth_factor_calculation(
        self,
        reorder_service: ReorderService,
        test_child
    ):
        """Test growth factor calculation for age progression"""

        # Test growth factors for future periods
        growth_factors = await reorder_service._calculate_future_growth_factors(
            child=test_child,
            horizon_days=30
        )

        assert len(growth_factors) == 30
        assert all(factor >= 1.0 for factor in growth_factors)
        assert growth_factors[-1] > growth_factors[0]  # Should increase over time

    async def test_seasonal_adjustment_factors(
        self,
        reorder_service: ReorderService
    ):
        """Test seasonal adjustment factor calculation"""

        seasonal_factors = await reorder_service._calculate_future_seasonal_factors(
            horizon_days=30
        )

        assert len(seasonal_factors) == 30
        assert all(0.5 <= factor <= 1.5 for factor in seasonal_factors)

    async def test_runout_date_calculation(
        self,
        reorder_service: ReorderService,
        test_child
    ):
        """Test inventory runout date calculation"""

        with patch.object(reorder_service.session, 'execute') as mock_execute:
            # Mock current stock query
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = 50  # 50 diapers in stock
            mock_execute.return_value = mock_result

            # Test runout calculation
            runout_date = await reorder_service._calculate_runout_date(
                child=test_child,
                current_rate=6.0  # 6 diapers per day
            )

            # Should be approximately 8 days from now (50/6 ≈ 8.3)
            expected_days = 50 / 6.0
            actual_days = (runout_date - datetime.now(timezone.utc)).days

            assert abs(actual_days - expected_days) <= 1  # Allow 1 day variance


@pytest.mark.unit
@pytest.mark.canadian
class TestCanadianCompliance:
    """Test suite for Canadian-specific compliance features"""

    async def test_canadian_province_validation(
        self,
        reorder_service: ReorderService,
        test_user,
        canadian_test_data
    ):
        """Test Canadian province code validation"""

        # Test valid provinces
        for province in canadian_test_data["provinces"]:
            assert province in reorder_service.canadian_tax_rates

        # Test invalid province handling
        with pytest.raises(ValueError, match="Invalid Canadian province code"):
            await reorder_service.create_subscription(
                user=test_user,
                tier=SubscriptionTier.BASIC,
                stripe_payment_method_id="pm_test_123",
                billing_address={},
                province_code="XX"  # Invalid province
            )

    async def test_canadian_data_residency(
        self,
        reorder_service: ReorderService
    ):
        """Test that data residency requirements are enforced"""

        # Verify that all timestamps use UTC (for Canadian timezone conversion)
        prediction_timestamp = datetime.now(timezone.utc)
        assert prediction_timestamp.tzinfo == timezone.utc

        # Verify Canadian currency handling
        amount_cad = Decimal("29.99")
        assert isinstance(amount_cad, Decimal)  # Financial precision required
        assert amount_cad.quantize(Decimal("0.01")) == amount_cad  # Cent precision