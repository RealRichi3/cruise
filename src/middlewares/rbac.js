function rbacMiddleware(requiredPrivileges) {
    return (req, res, next) => {
        const userRole = req.user.role;
        const userPrivileges = req.user.privileges;
        if (
            requiredPrivileges.some((privilege) =>
                userPrivileges.includes(privilege)
            )
        ) {
            next();
        } else {
            res.status(401).send({ message: 'Unauthorized' });
        }
    };
}

module.exports = rbacMiddleware;
