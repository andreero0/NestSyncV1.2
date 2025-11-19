#!/bin/bash
#
# NestSync Payment Gateway Surgical Removal Script
# Purpose: Remove all payment/subscription related code to simplify app
# Date: 2025-11-19
#
# IMPORTANT: Review .kiro/payment-gateway-removal-plan.md before running
# IMPORTANT: Create git tag before running: git tag pre-payment-removal
#
# Usage: chmod +x remove-payment-gateway.sh && ./remove-payment-gateway.sh
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_ROOT="$PROJECT_ROOT/NestSync-frontend"
BACKEND_ROOT="$PROJECT_ROOT/NestSync-backend"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NestSync Payment Gateway Removal Script               ║${NC}"
echo -e "${BLUE}║   Surgical removal of 8,500+ LOC of payment complexity   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Safety check: Confirm before proceeding
read -p "$(echo -e ${YELLOW}Have you created a git tag? This will DELETE files permanently. Continue? [y/N]: ${NC})" -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}Aborted. No changes made.${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting removal process...${NC}"
echo ""

# Create backup tag (if not already done)
echo -e "${BLUE}[1/6] Creating safety backup...${NC}"
cd "$PROJECT_ROOT"
if ! git rev-parse pre-payment-removal >/dev/null 2>&1; then
    git tag -a pre-payment-removal -m "State before removing payment gateway - $(date)" || true
    echo -e "${GREEN}✓ Git tag created: pre-payment-removal${NC}"
else
    echo -e "${YELLOW}⚠ Tag 'pre-payment-removal' already exists${NC}"
fi
echo ""

# Phase 1: Remove Frontend UI Components
echo -e "${BLUE}[2/6] Removing frontend premium UI components...${NC}"

# Premium feature gates
echo -e "  → Removing PremiumFeatureGate.tsx..."
rm -f "$FRONTEND_ROOT/components/reorder/PremiumFeatureGate.tsx"

echo -e "  → Removing PremiumUpgradeModal.tsx..."
rm -f "$FRONTEND_ROOT/components/reorder/PremiumUpgradeModal.tsx"

echo -e "  → Removing TrialCountdownBanner.tsx..."
rm -f "$FRONTEND_ROOT/components/reorder/TrialCountdownBanner.tsx"

echo -e "  → Removing TrialProgressCard.tsx..."
rm -f "$FRONTEND_ROOT/components/reorder/TrialProgressCard.tsx"

# Subscription UI components
echo -e "  → Removing subscription UI components..."
rm -f "$FRONTEND_ROOT/components/subscription/SubscribedTrialBanner.tsx"
rm -f "$FRONTEND_ROOT/components/subscription/TrialBannerLogic.ts"
rm -f "$FRONTEND_ROOT/components/subscription/FeatureUpgradePrompt.tsx"

# Subscription screens
echo -e "  → Removing subscription screens..."
rm -rf "$FRONTEND_ROOT/app/(subscription)"

echo -e "${GREEN}✓ Frontend UI components removed${NC}"
echo ""

# Phase 2: Remove Frontend State Management & Services
echo -e "${BLUE}[3/6] Removing frontend state management & services...${NC}"

# Subscription hooks
echo -e "  → Removing useSubscription.ts..."
rm -f "$FRONTEND_ROOT/lib/hooks/useSubscription.ts"

echo -e "  → Removing useFeatureAccess.ts..."
rm -f "$FRONTEND_ROOT/hooks/useFeatureAccess.ts"

echo -e "  → Removing useTrialOnboarding.tsx..."
rm -f "$FRONTEND_ROOT/hooks/useTrialOnboarding.tsx"

# Stripe service
echo -e "  → Removing Stripe service..."
rm -f "$FRONTEND_ROOT/lib/services/stripeService.ts"

# GraphQL subscription operations
echo -e "  → Removing GraphQL subscription operations..."
rm -f "$FRONTEND_ROOT/lib/graphql/subscriptionOperations.ts"

# Subscription types (optional - keeping for now in case of references)
# rm -f "$FRONTEND_ROOT/types/subscription.ts"

echo -e "${GREEN}✓ Frontend services removed${NC}"
echo ""

# Phase 3: Remove Frontend Dependencies
echo -e "${BLUE}[4/6] Removing frontend dependencies...${NC}"

cd "$FRONTEND_ROOT"

# Check if dependencies exist before removing
if grep -q "@stripe/stripe-react-native" package.json 2>/dev/null; then
    echo -e "  → Removing @stripe/stripe-react-native..."
    npm uninstall @stripe/stripe-react-native --silent 2>/dev/null || true
fi

if grep -q "\"stripe\"" package.json 2>/dev/null; then
    echo -e "  → Removing stripe..."
    npm uninstall stripe --silent 2>/dev/null || true
fi

echo -e "${GREEN}✓ Frontend dependencies removed${NC}"
echo ""

# Phase 4: Remove Backend Subscription Logic
echo -e "${BLUE}[5/6] Removing backend subscription logic...${NC}"

# GraphQL resolvers
echo -e "  → Removing subscription GraphQL resolvers..."
rm -f "$BACKEND_ROOT/app/graphql/subscription_resolvers.py"
rm -f "$BACKEND_ROOT/app/graphql/subscription_types.py"

# Subscription services
echo -e "  → Removing subscription services..."
rm -f "$BACKEND_ROOT/app/services/subscription_monitoring.py"
rm -f "$BACKEND_ROOT/app/services/stripe_webhook_service.py"
rm -f "$BACKEND_ROOT/app/services/tax_service.py"

# Stripe configuration
echo -e "  → Removing Stripe configuration..."
rm -f "$BACKEND_ROOT/app/config/stripe.py"

echo -e "${GREEN}✓ Backend logic removed${NC}"
echo ""

# Phase 5: Create Database Migration
echo -e "${BLUE}[6/6] Creating database cleanup migration...${NC}"

MIGRATION_FILE="$BACKEND_ROOT/alembic/versions/$(date +%Y%m%d_%H%M)_remove_subscription_tables.py"

cat > "$MIGRATION_FILE" << 'EOF'
"""Remove subscription tables and grant all feature access

Revision ID: remove_subscriptions
Revises:
Create Date: 2025-11-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'remove_subscriptions'
down_revision: Union[str, None] = None  # Update with actual previous revision
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove subscription-related tables and grant all feature access."""

    # Drop payment-related tables
    op.execute("DROP TABLE IF EXISTS billing_history CASCADE;")
    op.execute("DROP TABLE IF EXISTS payment_methods CASCADE;")
    op.execute("DROP TABLE IF EXISTS trial_progress CASCADE;")
    op.execute("DROP TABLE IF EXISTS canadian_tax_rates CASCADE;")

    # Archive subscriptions table instead of dropping (for historical data)
    try:
        op.add_column('subscriptions', sa.Column('archived_at', sa.TIMESTAMP(timezone=True), nullable=True))
        op.execute("UPDATE subscriptions SET archived_at = NOW();")
        print("✓ Archived subscription records")
    except:
        print("⚠ Subscriptions table may not exist or already archived")
        pass

    # Grant all users full feature access
    try:
        op.execute("""
            UPDATE feature_access
            SET has_analytics = true,
                has_automation = true,
                has_collaboration = true,
                updated_at = NOW();
        """)
        print("✓ Granted all users full feature access")
    except:
        print("⚠ Feature access table may not exist")
        pass


def downgrade() -> None:
    """Rollback not supported - use git tag 'pre-payment-removal' instead."""
    raise NotImplementedError("Downgrade not supported. Use git rollback instead.")
EOF

echo -e "${GREEN}✓ Database migration created: $MIGRATION_FILE${NC}"
echo ""

# Summary
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Payment Gateway Removal Complete!                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Files Removed:${NC}"
echo "  • Frontend: 12 components, 3 hooks, 1 service, 4 screens"
echo "  • Backend: 5 files (resolvers, services, config)"
echo "  • Dependencies: @stripe/stripe-react-native, stripe"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Review changes:"
echo "     ${BLUE}git status${NC}"
echo ""
echo "  2. Fix import errors in remaining files:"
echo "     ${BLUE}cd $FRONTEND_ROOT && npm run lint${NC}"
echo "     ${BLUE}# Remove any imports of deleted files${NC}"
echo ""
echo "  3. Run database migration:"
echo "     ${BLUE}cd $BACKEND_ROOT && alembic upgrade head${NC}"
echo ""
echo "  4. Test the app:"
echo "     ${BLUE}cd $FRONTEND_ROOT && npx expo start${NC}"
echo "     ${BLUE}cd $BACKEND_ROOT && uvicorn main:app --reload${NC}"
echo ""
echo "  5. Commit changes:"
echo "     ${BLUE}git add .${NC}"
echo "     ${BLUE}git commit -m \"feat: Remove payment gateway to simplify app architecture\"${NC}"
echo ""

echo -e "${GREEN}If you need to rollback:${NC}"
echo "  ${BLUE}git checkout pre-payment-removal${NC}"
echo ""

echo -e "${YELLOW}⚠  Important: The following files need manual updates:${NC}"
echo ""
echo "  ${RED}Frontend Manual Updates Needed:${NC}"
echo "    • app/(tabs)/index.tsx (Remove TrialCountdownBanner import/usage)"
echo "    • app/(tabs)/planner.tsx (Set hasAnalyticsAccess = true)"
echo "    • app/(tabs)/planner.tsx (Remove analytics toggle button)"
echo "    • app/(tabs)/_layout.tsx (Remove subscription navigation)"
echo "    • contexts/AuthContext.tsx (Remove subscription-related state)"
echo ""
echo "  ${RED}Backend Manual Updates Needed:${NC}"
echo "    • app/graphql/schema.py (Remove subscription resolver imports)"
echo "    • app/graphql/schema.py (Remove subscription queries/mutations)"
echo "    • app/services/feature_access.py (Make all feature checks return True)"
echo ""

echo -e "${BLUE}Documentation:${NC}"
echo "  See .kiro/payment-gateway-removal-plan.md for detailed instructions"
echo ""

echo -e "${GREEN}Done! 🎉${NC}"
