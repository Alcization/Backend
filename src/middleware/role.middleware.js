/**
 * Middleware to check if user has required role
 * Use after auth.middleware to ensure user is authenticated
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                message: 'Forbidden: Insufficient permissions',
                required_role: allowedRoles,
                your_role: userRole
            });
        }

        next();
    };
}

module.exports = requireRole;
