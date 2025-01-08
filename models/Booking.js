const mongoose = require('mongoose');

// Define the item schema (as used in the frontend)
const itemSchema = new mongoose.Schema({
    name: { type: String }, // Item name
    quantity: { type: String }, // Item quantity
    remarks: { type: String }, // Item FSDA-321
});

// Define the booking schema
const bookingSchema = new mongoose.Schema({
    venueType: {
        type: String,
        required: true,
        enum: ['Lawn', 'Banquet', 'Both'], // Matches frontend venue options
    },
    eventType: {
        type: String,
        required: true,
        enum: ['Marriage', 'Birthday', 'Corporate Party', 'Other'], // Matches event types from the frontend
    },
    groom: {
        type: String,
        required: function () { return this.eventType === 'Marriage'; }
    }, // Required only for Marriage events
    bride: {
        type: String,
        required: function () { return this.eventType === 'Marriage'; }
    }, // Required only for Marriage events
    customerName: { type: String, required: true },
    customerAddress: { type: String, required: true },
    customerNumber2: { type: Number, match: /^[0-9]{10}$/, },
    customerNumber: {
        type: Number,
        required: true,
        match: /^[0-9]{10}$/, // Validates 10-digit phone number
    },
    startDate: { type: Date, required: true },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value >= this.startDate; // Allow endDate to be the same as startDate
            },
            message: "End date must be the same or after the start date.",
        },
    },
    packageType: {
        type: String,
        required: true,
        enum: ['Afternoon', 'Classic', 'Deluxe', 'Signature', 'Elite', 'Custom'], // Matches package options from the frontend
    },
    items: { type: [itemSchema], default: [] }, // Items array
    totalAmount: { type: Number, required: true }, // Total amount before discounts
    discountAmount: { type: Number, required: true }, // Discount applied
    finalPrice: { type: Number, required: true }, // Total price after discounts
    advancePaid: {
        type: Number,
        required: true,
        default: 0, // Ensure a default value
    },
    additionalAmounts: [
        {
            amount: { type: Number }, // Optional field
            date: { type: Date, default: Date.now }, // Logs the date of the addition (optional)
        }
    ], // Amount paid upfront
    remainingAmount: { type: String, required: true }, // Amount remaining

    paymentStatus: { type: String, required: true, enum: ["Booked", "Enquiry"], default: "Booked" },
    cateringOption: { type: String, enum: ['no', 'yes'], default: 'no' },
    cateringItems: [
        {
            name: { type: String },
            quantity: { type: Number },
            remarks: { type: String }
        },
    ],
    GetPackageOption: { type: String, enum: ['no', 'yes'], default: 'no' },
    GetPackageItems: [
        {
            name: { type: String },
            quantity: { type: Number },
            remarks: { type: String }
        },
    ],
    checkDetails: {
        bankName: {
            type: String,
            validate: {
                validator: function (value) {
                    // Check if 'isRequired' is true, and if so, ensure 'bankName' is provided
                    return !this.checkDetails.isRequired || (this.checkDetails.isRequired && value);
                },
                message: "Bank Name is required when checkDetails.isRequired is true.",
            },
        },
        checkNumber: {
            type: String,
            validate: {
                validator: function (value) {
                    // Check if 'isRequired' is true, and if so, ensure 'checkNumber' is provided
                    return !this.checkDetails.isRequired || (this.checkDetails.isRequired && value);
                },
                message: "Check Number is required when checkDetails.isRequired is true.",
            },
        },
        remark: {
            type: String,
            default: "", // Optional field for remarks
        },
    },

    notes: { type: String }
});

// Create the Booking model
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;