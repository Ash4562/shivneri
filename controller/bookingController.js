const asyncHandler = require("express-async-handler")
const Booking = require("../models/Booking");

exports.createBooking = asyncHandler(async (req, res) => {
    const {
        venueType,
        eventType,
        groom,
        bride,
        customerName,
        customerNumber,
        startDate,
        endDate,
        packageType,
        items = [],
        advancePaid = 0,
        discountAmount = 0,
        totalAmount,
        cateringOption,
        cateringItems,
        paymentStatus
    } = req.body;

    console.log(req.body);


    // Calculate derived fields
    const finalPrice = totalAmount - discountAmount;
    const remainingAmount = finalPrice - advancePaid;


    if (eventType === 'Marriage' && (!groom || !bride)) {
        res.status(400);
        throw new Error('Groom and Bride names are required for Marriage events.');
    }

    // Check if startDate is before endDate
    if (new Date(startDate) >= new Date(endDate)) {
        res.status(400);
        throw new Error('Start date must be before the end date.');
    }

    // Check for date conflicts
    const existingBooking = await Booking.findOne({
        $or: [
            {
                startDate: { $lte: new Date(endDate) },
                endDate: { $gte: new Date(startDate) },
            },
        ],
    });

    if (existingBooking) {
        res.status(400);
        throw new Error('The selected date range is already booked.');
    }

    // Create a new booking
    const newBooking = new Booking({
        venueType,
        eventType,
        groom,
        bride,
        customerName,
        customerNumber,
        startDate,
        endDate,
        packageType,
        items,
        advancePaid,
        remainingAmount,
        totalAmount,
        discountAmount,
        finalPrice,
        cateringOption,
        cateringItems: cateringOption === 'yes' ? cateringItems : [],
        paymentStatus
    });

    const savedBooking = await newBooking.save();

    if (savedBooking) {
        res.status(201).json({
            message: 'Booking created successfully!',
            booking: savedBooking,
        });
    } else {
        res.status(500);
        throw new Error('Failed to create the booking.');
    }
});

exports.getBookings = asyncHandler(async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500);
        throw new Error(`Failed to fetch bookings: ${error.message}`);
    }
});