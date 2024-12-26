const express = require('express');
const router = express.Router();
const bookingController = require("../controller/bookingController")


// Route for creating a booking
router.post('/create', bookingController.createBooking);
router.get('/getallbookings', bookingController.getBookings);
router.put("/update/:id", bookingController.updateBooking); // Update booking
router.delete("/delete/:id", bookingController.deleteBooking); // Delete booking

module.exports = router;