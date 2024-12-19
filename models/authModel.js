const mongoose = require("mongoose")
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        require: true,
    },
    active: {
        type: String,
        default: true,
    },
    emailVerify: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: Number,
        required: true,
    },
    resetEmailDate: {
        type: Date,

    },
    resetLinkExpire: {
        type: Boolean,
        default: true,

    },
}, { timestamps: true })
module.exports = mongoose.model("user", userSchema)