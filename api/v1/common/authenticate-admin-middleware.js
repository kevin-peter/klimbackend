const jwt = require("jsonwebtoken");

const authenticateAdmin = (req, res, next) => {
    const ADMIN_TYPES = ["admin", "pa", "bank_manager"]
    if (!ADMIN_TYPES.includes(req.session.type)) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized request",
        });
    }
    next()
};

module.exports = {
    authenticateAdmin
}