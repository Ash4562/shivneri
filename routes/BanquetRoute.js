const express = require("express");
const {
    createBanquetBooking,
    getBanquetBookings,
    getBanquetBookingById,
    updateBanquetBooking,
    deleteBanquetBooking,
} = require("../controller/BanquetController"); // Adjust path to controller as needed

const router = express.Router();

// Routes for banquet bookings
router.post("/create", createBanquetBooking); // Create a new banquet booking
router.get("/", getBanquetBookings); // Get all banquet bookings
router.get("/get/:id", getBanquetBookingById); // Get a specific banquet booking by ID
router.put("/update/:id", updateBanquetBooking); // Update payment status of a banquet booking
router.delete("/delete/:id", deleteBanquetBooking); // Delete a banquet booking by ID

module.exports = router;