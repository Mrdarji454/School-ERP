export const authorize = (...allowedRoles) => {
    const roles = allowedRoles.flat();
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Acess denied"
            });
        }

        next();
    };
};
