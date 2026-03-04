-- ============================================
-- SIMPLE SAMPLE DATA FOR TESTING
-- Password for all accounts: Test@123
-- ============================================
-- Run this script to create test users and basic data
-- After running, you can log in with any of the test accounts

-- Clean up existing test data
DELETE FROM risk_assessment WHERE trip_id IN (SELECT trip_id FROM trip WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com'));
DELETE FROM trip WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
DELETE FROM saved_route WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
DELETE FROM saved_location WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
DELETE FROM noti_event WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
DELETE FROM notification_preference WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
DELETE FROM refresh_token WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
DELETE FROM user_roles WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
DELETE FROM business_user WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
DELETE FROM individual_user WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
DELETE FROM administrative_officer WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
DELETE FROM user_account WHERE email LIKE '%@test.com';

-- Insert test users (password hash for "Test@123")
INSERT INTO user_account (email, password_hash, phone_number, language, status, account_type) VALUES
('john.doe@test.com', '$2b$10$fkFyTVEoOZq21e/ZoD39mOVj98qFeXP5S467Ru743iVag7JxshcV2', '0901234567', 'en', 'active', 'individual'),
('nguyen.van.a@test.com', '$2b$10$fkFyTVEoOZq21e/ZoD39mOVj98qFeXP5S467Ru743iVag7JxshcV2', '0902345678', 'vi', 'active', 'individual'),
('business@test.com', '$2b$10$fkFyTVEoOZq21e/ZoD39mOVj98qFeXP5S467Ru743iVag7JxshcV2', '0281234567', 'vi', 'active', 'business'),
('admin@test.com', '$2b$10$fkFyTVEoOZq21e/ZoD39mOVj98qFeXP5S467Ru743iVag7JxshcV2', '0283456789', 'vi', 'active', 'admin_officer');

-- Insert user roles (all users get role 1=user, admins also get role 3=admin)
INSERT INTO user_roles (user_id, role_id)
SELECT user_id, 1 FROM user_account WHERE email LIKE '%@test.com';

INSERT INTO user_roles (user_id, role_id)
SELECT user_id, 3 FROM user_account WHERE email LIKE '%@test.com' AND account_type = 'admin_officer';

-- Insert individual user profiles
INSERT INTO individual_user (user_id, full_name)
SELECT user_id, 'John Doe' FROM user_account WHERE email = 'john.doe@test.com'
UNION ALL
SELECT user_id, 'Nguyen Van A' FROM user_account WHERE email = 'nguyen.van.a@test.com';

-- Insert business user profile
INSERT INTO business_user (user_id, company_name, tax_code)
SELECT user_id, 'Cong ty Van Chuyen Test', '0123456789' FROM user_account WHERE email = 'business@test.com';

-- Insert admin officer profile
INSERT INTO administrative_officer (user_id, department)
SELECT user_id, 'So Giao Thong Van Tai TP.HCM' FROM user_account WHERE email = 'admin@test.com';

-- Insert some saved locations
INSERT INTO saved_location (user_id, custom_name, address, latitude, longitude)
SELECT user_id, 'Home', '123 Main Street, District 1, HCMC', 10.7769, 106.7009 FROM user_account WHERE email = 'john.doe@test.com'
UNION ALL
SELECT user_id, 'Office', '456 Nguyen Hue, District 1, HCMC', 10.7740, 106.7010 FROM user_account WHERE email = 'john.doe@test.com'
UNION ALL
SELECT user_id, 'Nha', '789 Le Loi, Quan 1, TP.HCM', 10.7710, 106.6980 FROM user_account WHERE email = 'nguyen.van.a@test.com'
UNION ALL
SELECT user_id, 'Cong ty', '321 Hai Ba Trung, Quan 3', 10.7890, 106.6920 FROM user_account WHERE email = 'nguyen.van.a@test.com';

-- Insert notification preferences
INSERT INTO notification_preference (user_id, noti_type, threshold)
SELECT user_id, 'Traffic', 2 FROM user_account WHERE email LIKE '%@test.com'
UNION ALL
SELECT user_id, 'Flood', 2 FROM user_account WHERE email LIKE '%@test.com';

-- Insert some notification events
INSERT INTO noti_event (user_id, name, description, type, issue_at, is_read)
SELECT user_id, 'Un tac giao thong', 'Duong Nguyen Hue un tac nang', 'Traffic', NOW() - INTERVAL '1 hour', FALSE FROM user_account WHERE email = 'john.doe@test.com'
UNION ALL
SELECT user_id, 'Canh bao mua lon', 'Mua lon tai khu vuc Quan 1', 'Flood', NOW() - INTERVAL '30 minutes', FALSE FROM user_account WHERE email = 'nguyen.van.a@test.com';

-- Show results
SELECT 'Test users created successfully!' as message;
SELECT 
    email,
    account_type,
    status,
    'Test@123' as password
FROM user_account WHERE email LIKE '%@test.com'
ORDER BY email;
