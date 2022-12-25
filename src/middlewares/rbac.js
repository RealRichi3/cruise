function rbacMiddleware(allowed_roles) {
    return (req, res, next) => {
        const user_role = req.user.role;

        // If user role is in allowed roles, grant access
        if (allowed_roles.includes(user_role)) next();

        return next(
            new UnauthorizedError(
                'You are not authorized to perform this action'
            )
        );
    };
}

module.exports = rbacMiddleware;
