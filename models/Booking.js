const mongoose = require('mongoose');

// Define the item schema (as used in the frontend)
const itemSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Item name
    quantity: { type: Number, required: true }, // Item quantity
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
    customerNumber: {
        type: String,
        required: true,
        match: /^[0-9]{10}$/, // Validates 10-digit phone number
    },
    startDate: { type: Date, required: true },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value > this.startDate;
            },
            message: "End date must be after start date.",
        },
    },
    packageType: {
        type: String,
        required: true,
        enum: ['Silver', 'Gold', 'Basic'], // Matches package options from the frontend
    },
    items: { type: [itemSchema], default: [] }, // Items array
    totalAmount: { type: Number, required: true }, // Total amount before discounts
    discountAmount: { type: Number, required: true }, // Discount applied
    finalPrice: { type: Number, required: true }, // Total price after discounts
    advancePaid: { type: Number, required: true }, // Amount paid upfront
    remainingAmount: { type: Number, required: true }, // Amount remaining
    paymentStatus: { type: String, required: true, enum: ["Booked", "Enquiry"], default: "Booked" },
    cateringOption: { type: String, enum: ['no', 'yes'], default: 'no' },
    cateringItems: [
        {
            name: { type: String },
            quantity: { type: Number },
        },
    ]
});

// Create the Booking model
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;