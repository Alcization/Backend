/**
 * Middleware to check if user has required role
 * Use after auth.middleware to ensure user is authenticated
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check account_type (business, individual, admin_officer)
        const userAccountType = req.user.account_type;
        // Check roles array (admin, moderator, user)
        const userRoles = req.user.roles || [];

        // Check if user has required account_type or role
        const hasAccess = allowedRoles.some(role => 
            role === userAccountType || userRoles.includes(role)
        );

        if (!hasAccess) {
            return res.status(403).json({ 
                message: 'Forbidden: Insufficient permissions',
                required_role: allowedRoles,
                your_account_type: userAccountType,
                your_roles: userRoles
            });
        }

        next();
    };
}

module.exports = requireRole;
