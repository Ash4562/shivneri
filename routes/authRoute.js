// const { regiter, login, verifyOTP, sendResetLink, changePassword, logout } = require("../controller/authController");
const { regiter, login, verifyOTP, sendResetLink, changePassword, logout } = require("../controller/authController");
// const { protectedRouter } = require("middlewares/protected");

const router = require("express").Router();
router
    .post("/regiter", regiter)
    .post("/login", login)
    .post("/verify_otp/:userId", verifyOTP)
    .post("/reset-pass", sendResetLink)
    .post("/change-pass", changePassword)
    .post("/logout", logout)
module.exports = router