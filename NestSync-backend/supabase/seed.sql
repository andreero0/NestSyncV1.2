-- NestSync Database Seed Data
-- PIPEDA-compliant Canadian diaper planning application
-- Seed data for development and testing

-- Insert default diaper brands
INSERT INTO brands (name, country, is_active, created_at, updated_at) VALUES
('Huggies', 'CA', true, now(), now()),
('Pampers', 'CA', true, now(), now()),
('Honest', 'CA', true, now(), now()),
('Kirkland', 'CA', true, now(), now()),
('Parent''s Choice', 'CA', true, now(), now())
ON CONFLICT (name) DO NOTHING;

-- Insert default diaper sizes
INSERT INTO diaper_sizes (size_code, description, weight_range_kg, is_active, created_at, updated_at) VALUES
('NB', 'Newborn', '0-4.5', true, now(), now()),
('1', 'Size 1', '4-6', true, now(), now()),
('2', 'Size 2', '5-8', true, now(), now()),
('3', 'Size 3', '7-11', true, now(), now()),
('4', 'Size 4', '10-16', true, now(), now()),
('5', 'Size 5', '15-22', true, now(), now()),
('6', 'Size 6', '20+', true, now(), now())
ON CONFLICT (size_code) DO NOTHING;

-- Insert test user (only for development environment)
-- This will be removed in production
INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    timezone,
    privacy_consent,
    data_processing_consent,
    marketing_consent,
    consent_version,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'test@nestsync.ca',
    'Test',
    'User',
    'America/Toronto',
    true,
    true,
    false,
    '1.0',
    now(),
    now()
) ON CONFLICT (email) DO NOTHING;

-- Note: Additional seed data can be added based on specific testing requirements
-- All seed data respects PIPEDA compliance requirements
-- No real personal data should be included in seed files