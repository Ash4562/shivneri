const asyncHandler = require("express-async-handler")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
exports.protectedRouter = asyncHandler(async (req, res, next) => {
    const token = req.cookies["pro-cookie"]
    if (!token) {
        return res.status(401).json({ message: "NO Coookie Found" })
    }
    jwt.verify(token, process.env.JWT_KEY, (err, decode) => {
        if (err) {
            return res.status(401).json({ message: err.message || "Invalid Token" })
        }
        req.body.userId = decode.userId
        next()
    })
})