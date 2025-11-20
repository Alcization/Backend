const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserAccount, IndividualUser, BusinessUser } = require('../models/user.model');
const sequelize = require('../config/database');

class AuthService {
    async register(data) {
        const t = await sequelize.transaction(); // Dùng transaction để đảm bảo tạo cả 2 bảng thành công
        try {
            // 1. Hash pass
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);

            // 2. Tạo Account chung
            const user = await UserAccount.create({
                email: data.email,
                password_hash: hashedPassword,
                role: data.role // 'individual' hoặc 'business'
            }, { transaction: t });

            // 3. Tạo Profile riêng tùy role
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

        // Tạo Token
        const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return { user, token };
    }
}

module.exports = new AuthService();