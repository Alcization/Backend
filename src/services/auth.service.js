const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { UserAccount, IndividualUser, BusinessUser } = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const sequelize = require('../config/database');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
    async register(data) {
        const t = await sequelize.transaction();
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);

            const user = await UserAccount.create({
                email: data.email,
                password_hash: hashedPassword,
                role: data.role // 'individual' hoặc 'business'
            }, { transaction: t });

            if (data.role === 'individual') {
                await IndividualUser.create({ user_id: user.user_id, full_name: data.fullName }, { transaction: t });
            } else if (data.role === 'business') {
                await BusinessUser.create({ user_id: user.user_id, company_name: data.companyName }, { transaction: t });
            }

            await t.commit();
            return user;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async login(email, password) {
        const user = await UserAccount.findOne({ where: { email } });
        if (!user) throw new Error('User not found');

        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) throw new Error('Invalid password');

        // Tạo Access Token & Refresh Token
        const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const refreshToken = await this._generateRefreshToken(user.user_id);
        return { user, token, refreshToken };
    }

        async loginGoogle(idToken) {
            if (!idToken) throw new Error('Missing idToken');
            // Verify token with Google
            const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
            const payload = ticket.getPayload();
            const email = payload.email;
            const fullName = payload.name || '';

            // Find or create user
            let user = await UserAccount.findOne({ where: { email } });
            if (!user) {
                // create with random password
                const randomPass = Math.random().toString(36).slice(-12);
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(randomPass, salt);
                user = await UserAccount.create({ email, password_hash: hashedPassword, role: 'individual' });
                await IndividualUser.create({ user_id: user.user_id, full_name: fullName });
            }

            const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
            const refreshToken = await this._generateRefreshToken(user.user_id);
            return { user, token, refreshToken };
        }

    async _generateRefreshToken(userId) {
        const token = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await RefreshToken.create({ user_id: userId, token, expires_at: expiresAt });
        return token;
    }

    async refreshToken(refreshToken) {
        const tokenRecord = await RefreshToken.findOne({ where: { token: refreshToken } });
        if (!tokenRecord) throw new Error('Invalid refresh token');
        if (new Date() > new Date(tokenRecord.expires_at)) {
            await tokenRecord.destroy();
            throw new Error('Refresh token expired');
        }

        const user = await UserAccount.findByPk(tokenRecord.user_id);
        if (!user) throw new Error('User not found');

        // Generate new access token
        const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return { token };
    }
}

module.exports = new AuthService();