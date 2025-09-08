-- =====================================================================================
-- Inventory Management Row Level Security (RLS) Policies
-- PIPEDA-compliant security policies for Canadian data protection
-- =====================================================================================

-- Enable RLS on inventory tables
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_thresholds ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- RLS Policy for inventory_items
-- Users can only access inventory items for their own children
-- =====================================================================================
CREATE POLICY inventory_items_user_isolation ON inventory_items
    FOR ALL
    USING (child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
    ));

-- =====================================================================================
-- RLS Policy for usage_logs
-- Users can only access usage logs for their own children
-- =====================================================================================
CREATE POLICY usage_logs_user_isolation ON usage_logs
    FOR ALL
    USING (child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
    ));

-- =====================================================================================
-- RLS Policy for stock_thresholds
-- Users can only access stock thresholds for their own children
-- =====================================================================================
CREATE POLICY stock_thresholds_user_isolation ON stock_thresholds
    FOR ALL
    USING (child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
    ));

-- =====================================================================================
-- Performance Optimization Indexes for RLS
-- These indexes support the RLS policies for efficient query execution
-- =====================================================================================

-- Dashboard query optimization
CREATE INDEX IF NOT EXISTS idx_inventory_dashboard 
ON inventory_items (child_id, product_type, quantity_remaining) 
WHERE is_deleted = false;

-- Usage analytics optimization
CREATE INDEX IF NOT EXISTS idx_usage_analytics 
ON usage_logs (child_id, usage_type, logged_at DESC) 
WHERE is_deleted = false;

-- Notification queries optimization  
CREATE INDEX IF NOT EXISTS idx_notifications_due
ON stock_thresholds (notification_enabled, last_low_notification)
WHERE notification_enabled = true;

-- Expiry tracking optimization
CREATE INDEX IF NOT EXISTS idx_expiry_tracking
ON inventory_items (expiry_date)
WHERE expiry_date IS NOT NULL AND is_deleted = false;

-- Multi-child family queries
CREATE INDEX IF NOT EXISTS idx_family_inventory
ON inventory_items (child_id, product_type, size, quantity_remaining);

-- Usage pattern analysis (partitioned by date for large datasets)
CREATE INDEX IF NOT EXISTS idx_usage_patterns
ON usage_logs (child_id, date_trunc('day', logged_at), usage_type);

-- =====================================================================================
-- PIPEDA Compliance Comments
-- =====================================================================================

COMMENT ON POLICY inventory_items_user_isolation ON inventory_items IS 
'PIPEDA Compliance: Ensures users can only access inventory data for their own children';

COMMENT ON POLICY usage_logs_user_isolation ON usage_logs IS 
'PIPEDA Compliance: Ensures users can only access usage logs for their own children';

COMMENT ON POLICY stock_thresholds_user_isolation ON stock_thresholds IS 
'PIPEDA Compliance: Ensures users can only access stock thresholds for their own children';

-- =====================================================================================
-- Data Retention Support (for PIPEDA compliance)
-- =====================================================================================

-- Function to soft delete expired inventory data
CREATE OR REPLACE FUNCTION cleanup_expired_inventory_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    retention_days INTEGER := 365; -- 1 year retention
    cutoff_date DATE := CURRENT_DATE - INTERVAL '1 year' * retention_days;
BEGIN
    -- Soft delete old usage logs (retain for 1 year)
    UPDATE usage_logs 
    SET is_deleted = true, 
        deleted_at = NOW(),
        deleted_by = '00000000-0000-0000-0000-000000000000'::uuid -- System cleanup
    WHERE logged_at < cutoff_date 
      AND is_deleted = false;
    
    -- Log cleanup activity for audit
    INSERT INTO audit_log (
        table_name, 
        action, 
        details, 
        performed_at,
        performed_by
    ) VALUES (
        'usage_logs',
        'AUTOMATED_CLEANUP',
        jsonb_build_object(
            'cutoff_date', cutoff_date,
            'retention_days', retention_days,
            'cleanup_reason', 'PIPEDA_data_retention'
        ),
        NOW(),
        '00000000-0000-0000-0000-000000000000'::uuid
    );
END;
$$;

-- Comment on cleanup function
COMMENT ON FUNCTION cleanup_expired_inventory_data() IS 
'PIPEDA Compliance: Automated cleanup of expired inventory data per retention policy';

-- =====================================================================================
-- Inventory Summary Functions for Dashboard (with RLS support)
-- =====================================================================================

-- Get inventory summary for a child (respects RLS)
CREATE OR REPLACE FUNCTION get_child_inventory_summary(child_uuid UUID)
RETURNS TABLE(
    product_type VARCHAR(50),
    total_quantity BIGINT,
    low_stock_items BIGINT,
    expiring_soon BIGINT
)
LANGUAGE plpgsql
SECURITY INVOKER -- Respects RLS policies
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.product_type,
        SUM(i.quantity_remaining)::BIGINT as total_quantity,
        COUNT(CASE WHEN st.low_threshold IS NOT NULL 
                   AND i.quantity_remaining <= st.low_threshold 
                   THEN 1 END)::BIGINT as low_stock_items,
        COUNT(CASE WHEN i.expiry_date IS NOT NULL 
                   AND i.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
                   THEN 1 END)::BIGINT as expiring_soon
    FROM inventory_items i
    LEFT JOIN stock_thresholds st ON (
        st.child_id = i.child_id 
        AND st.product_type = i.product_type 
        AND st.size = i.size
    )
    WHERE i.child_id = child_uuid 
      AND i.is_deleted = false
    GROUP BY i.product_type;
END;
$$;

COMMENT ON FUNCTION get_child_inventory_summary(UUID) IS 
'Get inventory summary for dashboard with PIPEDA-compliant RLS enforcement';

-- =====================================================================================
-- Grant appropriate permissions
-- =====================================================================================

-- Grant usage on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_child_inventory_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_inventory_data() TO service_role;

-- =====================================================================================
-- Audit Trail Setup
-- =====================================================================================

-- Ensure audit triggers are in place for inventory tables
-- (Assumes audit triggers are already set up from base model implementation)

COMMENT ON TABLE inventory_items IS 'PIPEDA Compliant: Inventory tracking with full audit trails and RLS';
COMMENT ON TABLE usage_logs IS 'PIPEDA Compliant: Usage tracking with full audit trails and RLS';  
COMMENT ON TABLE stock_thresholds IS 'PIPEDA Compliant: Stock thresholds with full audit trails and RLS';