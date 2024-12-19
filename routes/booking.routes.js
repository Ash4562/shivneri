const express = require('express');
const router = express.Router();
const bookingController = require("../controller/bookingController")


// Route for creating a booking
router.post('/create', bookingController.createBooking);
router.get('/getallbookings', bookingController.getBookings);

module.exports = router;