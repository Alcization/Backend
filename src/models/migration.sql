-- Migration Script: Tái kiến trúc Authentication với Role-Based Access Control
-- Theo: https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles

-- ============================================
-- BƯỚC 1: Tạo bảng roles
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Thêm dữ liệu roles mặc định
INSERT INTO roles (name) VALUES ('user'), ('moderator'), ('admin')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- BƯỚC 2: Tạo bảng user_roles (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES user_account(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- ============================================
-- BƯỚC 3: Cập nhật bảng user_account
-- ============================================

-- Thêm column username (nếu chưa có)
ALTER TABLE user_account 
ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE;

-- Thêm column updated_at (nếu chưa có)
ALTER TABLE user_account 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Đổi tên column role thành account_type (nếu có)
-- Lưu ý: Cần kiểm tra và điều chỉnh theo cấu trúc hiện tại
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_account' AND column_name = 'role'
    ) THEN
        -- Tạo column account_type mới
        ALTER TABLE user_account 
        ADD COLUMN IF NOT EXISTS account_type VARCHAR(50);
        
        -- Copy dữ liệu từ role sang account_type
        UPDATE user_account 
        SET account_type = 
            CASE 
                WHEN role = 'individual' THEN 'individual'
                WHEN role = 'business' THEN 'business'
                WHEN role = 'admin' THEN 'individual' -- Admin chuyển thành individual
                ELSE 'individual'
            END
        WHERE account_type IS NULL;
        
        -- Set default value
        ALTER TABLE user_account 
        ALTER COLUMN account_type SET DEFAULT 'individual';
        
        -- Migrate users từ role cũ sang user_roles
        -- User có role='admin' -> gán role admin + user
        INSERT INTO user_roles (user_id, role_id)
        SELECT ua.user_id, r.id
        FROM user_account ua
        CROSS JOIN roles r
        WHERE ua.role = 'admin' 
            AND r.name IN ('admin', 'user')
            AND NOT EXISTS (
                SELECT 1 FROM user_roles ur 
                WHERE ur.user_id = ua.user_id AND ur.role_id = r.id
            );
        
        -- User có role='individual' hoặc 'business' -> gán role user
        INSERT INTO user_roles (user_id, role_id)
        SELECT ua.user_id, r.id
        FROM user_account ua
        CROSS JOIN roles r
        WHERE ua.role IN ('individual', 'business')
            AND r.name = 'user'
            AND NOT EXISTS (
                SELECT 1 FROM user_roles ur 
                WHERE ur.user_id = ua.user_id AND ur.role_id = r.id
            );
        
        -- Drop column role cũ (CẢNH BÁO: Chỉ làm sau khi đã backup)
        -- ALTER TABLE user_account DROP COLUMN role;
        
        RAISE NOTICE 'Migration completed: role -> account_type + user_roles';
    ELSE
        RAISE NOTICE 'Column "role" does not exist, skipping migration';
    END IF;
END $$;

-- ============================================
-- BƯỚC 4: Gán role mặc định cho users chưa có role
-- ============================================
INSERT INTO user_roles (user_id, role_id)
SELECT ua.user_id, r.id
FROM user_account ua
CROSS JOIN roles r
WHERE r.name = 'user'
    AND NOT EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = ua.user_id
    );

-- ============================================
-- BƯỚC 5: Tạo indexes để tối ưu performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_account_username ON user_account(username);
CREATE INDEX IF NOT EXISTS idx_user_account_email ON user_account(email);

-- ============================================
-- Verify migration
-- ============================================
-- Kiểm tra số lượng users và roles
SELECT 
    'Total users' as metric,
    COUNT(*) as count
FROM user_account

UNION ALL

SELECT 
    'Users with roles',
    COUNT(DISTINCT user_id)
FROM user_roles

UNION ALL

SELECT 
    'Total roles',
    COUNT(*)
FROM roles;

-- Xem phân bố roles
SELECT 
    r.name as role_name,
    COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.name
ORDER BY user_count DESC;

-- ============================================
-- ROLLBACK (Nếu cần)
-- ============================================
-- KHÔNG thực hiện các lệnh dưới đây trừ khi cần rollback
-- DROP TABLE IF EXISTS user_roles;
-- DROP TABLE IF EXISTS roles;
-- ALTER TABLE user_account DROP COLUMN IF EXISTS username;
-- ALTER TABLE user_account DROP COLUMN IF EXISTS account_type;
-- ALTER TABLE user_account DROP COLUMN IF EXISTS updated_at;
