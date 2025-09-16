-- Temporarily disable time constraint to allow retroactive data population
-- This should only be used for data seeding purposes
--
-- ISSUE: When populating historical data chronologically, the GraphQL resolver
-- calculates time_since_last_change by finding the most RECENT change (not the
-- previous chronological change), which causes negative values for historical data.
--
-- SOLUTION: Temporarily disable constraint, populate data, fix calculations, re-enable

-- Drop the constraint
ALTER TABLE usage_logs DROP CONSTRAINT IF EXISTS check_time_since_last_change_positive;

-- Log the action for audit purposes
INSERT INTO public.audit_log (action, details, created_at)
VALUES ('constraint_disabled', 'Disabled check_time_since_last_change_positive for retroactive data population', NOW())
ON CONFLICT DO NOTHING;

-- Show current status
SELECT 'Constraint disabled successfully' as status;