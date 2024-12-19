const mongoose = require('mongoose');

// Define the schema for Banquet Booking
const BanquetBookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerNumber: { type: String, required: true },
  eventDate: {
    type: [Date],
    required: true,
    validate: {
      validator: function (value) {
        // Ensure eventDate has exactly two elements: [startDate, endDate]
        if (!value || value.length !== 2) return false;

        const [startDate, endDate] = value;

        // Allow endDate to be equal to or after startDate
        return endDate >= startDate;
      },
      message: "End date must be after or equal to the start date.",
    },
  },

  eventType: { type: String, required: true },
  hallCharges: { type: Number, required: true }, // Changed to Number for consistency
  selectedThali: { type: String, required: true, enum: ["Normal", "Supreme", "Deluxe"] },
  thaliPrice: { type: Number, required: true }, // Price per plate
  numberOfPeople: { type: Number, required: true }, // Number of plates
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, default: 1 },
    },
  ],
  totalPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalPrice: { type: Number, required: true },
  eventTiming: { type: String, required: true, enum: ["Day", "Night"] }, // Add this line for event timing

  // New field for payment status
  paymentStatus: {
    type: String,
    enum: ["Pending", "Successful"],
    default: "Pending"  // Default to 'Pending'
  },
}, { timestamps: true });


// Export the model
module.exports = mongoose.model('BanquetBooking', BanquetBookingSchema);