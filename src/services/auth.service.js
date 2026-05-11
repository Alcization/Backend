const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { UserAccount, IndividualUser, BusinessUser } = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const Role = require('../models/role.model');
const Otp = require('../models/otp.model');
const sequelize = require('../config/database');
const createOTP = require('../helpers/createOTP');
const sendMail = require('../helpers/sendMail');
const sendMailResend = require('../helpers/sendMailResend');

const getGoogleClientIds = () => {
    const clientIdsFromList = (process.env.GOOGLE_CLIENT_IDS || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

    const clientIds = [...clientIdsFromList];
    if (process.env.GOOGLE_CLIENT_ID) {
        clientIds.push(process.env.GOOGLE_CLIENT_ID.trim());
    }

    return Array.from(new Set(clientIds));
};

const createGoogleClient = () => {
    if (process.env.GOOGLE_CLIENT_ID) {
        return new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    return new OAuth2Client();
};

const googleClient = createGoogleClient();

/**
 * Authentication Service - JWT với Role-Based Access Control
 * Theo: https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles
 */
class AuthService {
    _createHttpError(message, status = 400) {
        const err = new Error(message);
        err.status = status;
        return err;
    }

    /**
     * Đăng ký người dùng mới với role assignment
     */
    async register(data) {
        const t = await sequelize.transaction();
        try {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);

            // Tạo user account
            const user = await UserAccount.create({
                email: data.email,
                username: data.username,
                password_hash: hashedPassword,
                account_type: data.accountType || 'individual'
            }, { transaction: t });

            // Tạo profile theo loại tài khoản
            if (user.account_type === 'individual') {
                await IndividualUser.create({ 
                    user_id: user.user_id, 
                    full_name: data.fullName 
                }, { transaction: t });
            } else if (user.account_type === 'business') {
                await BusinessUser.create({ 
                    user_id: user.user_id, 
                    company_name: data.companyName,
                    tax_code: data.taxCode
                }, { transaction: t });
            }

            // Gán role mặc định (user) hoặc roles được chỉ định
            const rolesToAssign = data.roles || ['user'];
            const roleRecords = await Role.findAll({
                where: { name: rolesToAssign },
                transaction: t
            });

            if (roleRecords.length === 0) {
                throw new Error('Default role not found. Please ensure roles are initialized.');
            }

            await user.setRoles(roleRecords, { transaction: t });

            await t.commit();

            // Trả về user với roles
            const userWithRoles = await UserAccount.findByPk(user.user_id, {
                include: [{
                    model: Role,
                    as: 'roles',
                    attributes: ['id', 'name'],
                    through: { attributes: [] }
                }]
            });

            return userWithRoles;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Đăng nhập với username/email và password
     */
    async login(emailOrUsername, password) {
        // Tìm user theo email hoặc username
        const user = await UserAccount.findOne({
            where: {
                [sequelize.Sequelize.Op.or]: [
                    { email: emailOrUsername },
                    { username: emailOrUsername }
                ]
            },
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            }]
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Kiểm tra password
        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) {
            throw new Error('Invalid password');
        }

        // Tạo Access Token với roles
        const roles = user.roles.map(role => role.name);
        const token = jwt.sign(
            { 
                id: user.user_id,
                roles: roles,
                account_type: user.account_type
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        // Tạo Refresh Token
        const refreshToken = await this._generateRefreshToken(user.user_id);

        return {
            id: user.user_id,
            username: user.username,
            email: user.email,
            roles: roles,
            accessToken: token,
            refreshToken: refreshToken
        };
    }

    /**
     * Đăng nhập qua Google OAuth
     */
    async loginGoogle(idToken) {
        const identity = await this._verifyGoogleIdentity(idToken);
        const email = identity.email;
        const fullName = identity.fullName;

        const t = await sequelize.transaction();
        try {
            let isNewUser = false;

            // Tìm hoặc tạo user
            let user = await UserAccount.findOne({
                where: { email },
                include: [{
                    model: Role,
                    as: 'roles',
                    attributes: ['id', 'name'],
                    through: { attributes: [] }
                }],
                transaction: t
            });

            if (!user) {
                isNewUser = true;

                // Tạo user mới với random password
                const randomPass = crypto.randomBytes(16).toString('hex');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(randomPass, salt);
                
                user = await UserAccount.create({
                    email,
                    password_hash: hashedPassword,
                    account_type: 'individual'
                }, { transaction: t });

                await IndividualUser.create({
                    user_id: user.user_id,
                    full_name: fullName
                }, { transaction: t });

                // Gán role mặc định
                const defaultRole = await Role.findOne({
                    where: { name: 'user' },
                    transaction: t
                });

                if (!defaultRole) {
                    throw this._createHttpError('Default role not found. Please initialize roles first.', 500);
                }

                await user.setRoles([defaultRole], { transaction: t });

                // Reload user với roles
                user = await UserAccount.findByPk(user.user_id, {
                    include: [{
                        model: Role,
                        as: 'roles',
                        attributes: ['id', 'name'],
                        through: { attributes: [] }
                    }],
                    transaction: t
                });
            }

            await t.commit();

            // Tạo tokens
            const roles = user.roles.map(role => role.name);
            const token = jwt.sign(
                { 
                    id: user.user_id,
                    roles: roles,
                    account_type: user.account_type
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '24h' }
            );

            const refreshToken = await this._generateRefreshToken(user.user_id);

            return {
                id: user.user_id,
                username: user.username,
                email: user.email,
                roles: roles,
                isNewUser,
                accessToken: token,
                refreshToken: refreshToken
            };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async _verifyGoogleIdentity(input) {
        const tokenValue = typeof input === 'string' ? input : '';
        const trimmed = tokenValue.trim();

        if (!trimmed) {
            throw this._createHttpError('Missing Google credential (idToken or authorization code).');
        }

        const configuredAudiences = getGoogleClientIds();
        if (configuredAudiences.length === 0) {
            throw this._createHttpError('Google OAuth is not configured. Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_IDS.', 500);
        }

        let idToken = trimmed;

        // OAuth authorization code thường không chứa dấu chấm; đổi sang id_token trước khi verify.
        if (!trimmed.includes('.')) {
            if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
                throw this._createHttpError(
                    'Google OAuth code flow is not fully configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL.',
                    500
                );
            }

            const oauthClient = new OAuth2Client(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_CALLBACK_URL
            );

            let tokenResponse;
            try {
                tokenResponse = await oauthClient.getToken(trimmed);
            } catch (error) {
                throw this._createHttpError('Invalid Google authorization code.');
            }

            idToken = tokenResponse.tokens.id_token;
            if (!idToken) {
                throw this._createHttpError('Google token exchange did not return id_token.');
            }
        }

        let ticket;
        try {
            ticket = await googleClient.verifyIdToken({
                idToken,
                audience: configuredAudiences
            });
        } catch (error) {
            throw this._createHttpError('Invalid Google token.');
        }

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw this._createHttpError('Unable to read email from Google token.');
        }

        if (payload.email_verified === false) {
            throw this._createHttpError('Google account email is not verified.');
        }

        return {
            email: String(payload.email).trim().toLowerCase(),
            fullName: payload.name || ''
        };
    }

    /**
     * Đăng xuất - xóa refresh token
     */
    async logout(userId) {
        await RefreshToken.destroy({
            where: { user_id: userId }
        });
        return { message: 'Logged out successfully' };
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        const tokenRecord = await RefreshToken.findOne({ 
            where: { token: refreshToken } 
        });

        if (!tokenRecord) {
            throw new Error('Invalid refresh token');
        }

        if (new Date() > new Date(tokenRecord.expires_at)) {
            await tokenRecord.destroy();
            throw new Error('Refresh token expired');
        }

        const user = await UserAccount.findByPk(tokenRecord.user_id, {
            include: [{
                model: Role,
                as: 'roles',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            }]
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Tạo access token mới
        const roles = user.roles.map(role => role.name);
        const token = jwt.sign(
            { 
                id: user.user_id,
                roles: roles,
                account_type: user.account_type
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        return { accessToken: token };
    }

    /**
     * Gửi mã OTP đến email, hiệu lực 5 phút
     * Sử dụng Mailgun nếu được cấu hình, ngược lại dùng SMTP
     */
    async sendOtp(email) {
        if (!email) {
            const err = new Error('Email is required');
            err.status = 400;
            throw err;
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            const err = new Error('Invalid email format');
            err.status = 400;
            throw err;
        }

        const code = createOTP(6);

        // Mỗi email chỉ giữ 1 OTP mới nhất
        await Otp.destroy({ where: { email: normalizedEmail } });
        await Otp.create({
            email: normalizedEmail,
            code,
            time: new Date()
        });

        const otpHtml = `<p>Mã OTP của bạn là: <b>${code}</b></p><p>Mã có hiệu lực trong 5 phút.</p>`;
        
        // Sử dụng Resend nếu được cấu hình, ngược lại dùng SMTP
        const useResend = !!process.env.RESEND_API_KEY;

        try {
            if (useResend) {
                await sendMailResend(
                    normalizedEmail,
                    'Mã OTP xác thực',
                    otpHtml
                );
            } else {
                await sendMail(
                    normalizedEmail,
                    'Mã OTP xác thực',
                    otpHtml
                );
            }
        } catch (error) {
            // Nếu Resend fail, thử dùng SMTP
            if (useResend) {
                console.error('Resend failed:', error.message);
                try {
                    await sendMail(normalizedEmail, 'Mã OTP xác thực', otpHtml);
                } catch (smtpError) {
                    console.error('SMTP failed:', smtpError.message);
                    throw new Error('Failed to send OTP. Both Resend and SMTP are unavailable.');
                }
            } else {
                throw error;
            }
        }

        return { message: 'OTP sent successfully' };
    }

    /**
     * Xác thực OTP còn hiệu lực trong 5 phút
     */
    async verifyOtp({ email, code }) {
        if (!email || !code) {
            const err = new Error('Email and code are required');
            err.status = 400;
            throw err;
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedCode = String(code).trim();

        const otpRecord = await Otp.findOne({
            where: {
                email: normalizedEmail,
                code: normalizedCode
            }
        });

        if (!otpRecord) {
            const err = new Error('Invalid OTP');
            err.status = 400;
            throw err;
        }

        const createdTime = new Date(otpRecord.time).getTime();
        const now = Date.now();
        const isExpired = now - createdTime > 5 * 60 * 1000;

        if (isExpired) {
            await otpRecord.destroy();
            const err = new Error('OTP expired');
            err.status = 400;
            throw err;
        }

        // Dùng một lần: xác thực thành công thì xóa
        await otpRecord.destroy();
        return true;
    }

    /**
     * Cập nhật mật khẩu mới theo email
     */
    async resetPassword({ email, newPassword }) {
        if (!email || !newPassword) {
            const err = new Error('Email and newPassword are required');
            err.status = 400;
            throw err;
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        if (String(newPassword).length < 6) {
            const err = new Error('newPassword must be at least 6 characters');
            err.status = 400;
            throw err;
        }

        const user = await UserAccount.findOne({ where: { email: normalizedEmail } });
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(String(newPassword), salt);

        await user.update({ password_hash: hashedPassword });

        // Thu hồi refresh token cũ để tránh tiếp tục dùng phiên cũ
        await RefreshToken.destroy({ where: { user_id: user.user_id } });

        return { message: 'Password updated successfully' };
    }

    /**
     * Tạo refresh token mới
     */
    async _generateRefreshToken(userId) {
        const token = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        
        await RefreshToken.create({
            user_id: userId,
            token,
            expires_at: expiresAt
        });

        return token;
    }
}

module.exports = new AuthService();