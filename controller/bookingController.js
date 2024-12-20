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
        cateringItems = [],
        paymentStatus = "Booked",
    } = req.body;


    // Calculate derived fields
    const finalPrice = totalAmount - discountAmount;
    const remainingAmount = finalPrice - advancePaid;

    // Validate required fields based on eventType
    if (eventType === "Marriage" && (!groom || !bride)) {
        res.status(400);
        throw new Error("Groom and Bride names are required for Marriage events.");
    }

    // Check if startDate is before or the same as endDate
    if (new Date(startDate) > new Date(endDate)) {
        res.status(400);
        throw new Error("Start date must be the same or before the end date.");
    }

    // Check for date conflicts with existing bookings
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
        throw new Error("The selected date range is already booked.");
    }

    // Validate required fields
    if (!packageType) {
        res.status(400);
        throw new Error("Package type is required.");
    }

    if (!venueType || !eventType || !customerName || !customerNumber || !startDate || !endDate) {
        res.status(400);
        throw new Error("All required fields must be filled.");
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
        cateringItems: cateringOption === "yes" ? cateringItems : [],
        paymentStatus,
    });

    // Save the booking and handle errors
    try {
        const savedBooking = await newBooking.save();
        res.status(201).json({
            message: "Booking created successfully!",
            booking: savedBooking,
        });
    } catch (error) {
        res.status(500);
        throw new Error("Failed to create the booking.");
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