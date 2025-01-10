const asyncHandler = require("express-async-handler")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/authModel")
const sendEmail = require("../utils/emails")
// const sendEmail = require("../utils/email")


exports.regiter = asyncHandler(async (req, res) => {
    const { email, password, name } = req.body
    if (validator.isEmpty(email)
        || validator.isEmpty(password)
        || validator.isEmpty(name)) {

        return res.status(400).json({ message: "all field required" })

    } if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Plz provide Valid Email " })

    } if (!validator.isStrongPassword(password)) {
        return res.status(400).json({ message: "PLZ provide Strong Pasword" })

    }
    const isExist = await User.findOne({ email })
    if (isExist) {
        return res.status(400).json({ message: "Email Already Registerd With us" })

    }
    console.log(req.body);


    const hashPass = await bcrypt.hash(password, 10)
    const OTP = Math.floor(Math.random() * 1000000)
    const x = await sendEmail({
        to: email,
        subject: "DO Not share this OTP",
        message: `
        Thank you  ${name} for regitring with us 
        OTP: ${OTP}
        `
    })
    const result = await User.create({
        ...req.body,
        password: hashPass,
        emailVerify: false,
        active: true,
        otp: OTP,
    })
    res.status(200).json({
        message: `${name} Regiter Success`,
        result: {
            _id: result._id,
            name: result.name,

        }
    })
})


exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (validator.isEmpty(email) || validator.isEmpty(password)) {
        return res.status(400).json({ message: "all field required" })
    } if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Plz provide Valid Email" })

    }
    if (!validator.isStrongPassword(password)) {
        return res.status(400).json({ message: "PLZ provide Strong Pasword" })

    }
    const result = await User.findOne({ email })
    if (!result) {
        return res.status(400).json({ message: "Email Not Found" })
    }
    const verify = await bcrypt.compare(password, result.password)
    if (!verify) {
        return res.status(400).json({ message: "Password Do NOT Match" })

    }
    const token = jwt.sign({ userId: result._id }, process.env.JWT_KEY, {
        expiresIn: "7d"
    })
    res.cookie("pro-cookie", token, {
        maxAge: 1000 * 60 * 60 * 24, httpOnly: true,
        // secure:true
    })
    res.status(200).json({
        message: "Login success",
        result: {
            _id: result._id,
            name: result.name,
            email: result.email,
            active: result.active,
            emailVerify: result.emailVerify,
        },
    })
})


exports.verifyOTP = asyncHandler(async (req, res) => {
    const { otp } = req.body
    const { userId } = req.params

    const result = await User.findById(userId)
    if (result.otp != otp) {
        return res.status(400).json({ message: "OTP MissMatch" })
    }
    await User.findByIdAndUpdate(userId, { emailVerify: true })
    res.status(200).json({ message: "OTP Verify Success" })
})

exports.sendResetLink = asyncHandler(async (req, res) => {
    const { email } = req.body;
    console.log(email);


    // Validate email presence
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "No user found with this email" });
    }

    // Generate reset link
    // const resetLink = `https://shivneri.onrender.com/change-pass/${user._id}`;
    const resetLink = `http://localhost:5173/change-pass/${user._id}`;

    // Send reset email
    await sendEmail({
        to: user.email,
        subject: "Reset Password",
        message: `<p>Click the link below to reset your password:</p><a href="${resetLink}">Change Password</a>`,
    });

    // Update user with reset link expiration details
    await User.findByIdAndUpdate(user._id, {
        resetEmailDate: Date.now() + 15 * 60 * 1000, // 15 minutes
        resetLinkExpire: false,
    });

    // Respond with success message
    res.status(200).json({ message: "Reset link sent successfully to your email" });
});




// Change password logic
exports.changePassword = asyncHandler(async (req, res) => {
    const { password, email, user } = req.body;  // Get email from the request body instead of userId
    console.log(req.body);

    // Find the user by email
    const result = await User.findOne({ user });
    console.log(user);


    // If no user found, return an error
    if (!result) {
        return res.status(404).json({ message: 'User not found' });
    }

    // If reset link has already been used, return an error
    if (result.resetLinkExpire) {
        return res.status(400).json({ message: 'Link already used' });
    }

    // If the reset link has expired
    if (result.resetEmailDate < Date.now()) {
        return res.status(400).json({ message: 'Link expired' });
    }

    // Hash the new password
    const hashPass = await bcrypt.hash(password, 10);

    // Update the user's password in the database
    await User.findOneAndUpdate({ user }, { password: hashPass, resetLinkExpire: true }); // Mark the link as used

    // Clear any cookies (if necessary)
    res.clearCookie('pro-cookie');

    // Send a success response
    res.status(200).json({ message: 'Password updated successfully!' });
});




exports.logout = asyncHandler(async (req, res) => {

    res.clearCookie("pro-cookie")
    res.status(200).json({ message: "Logout Success" })
})