const asyncHandler = require("express-async-handler")
const Booking = require("../models/Booking");
const mongoose = require('mongoose');


exports.createBooking = asyncHandler(async (req, res) => {
    const {
        venueType,
        eventType,
        groom,
        bride,
        customerName,
        customerNumber,
        customerAddress,
        startDate,
        endDate,
        packageType,
        items = [],
        advancePaid = 0,
        additionalAmounts = 0,
        discountAmount = 0,
        totalAmount,
        checkDetails,
        cateringOption,
        cateringItems = [],
        GetPackageOption,
        GetPackageItems = [],
        paymentStatus = "Booked",
    } = req.body;


    // Calculate derived fields
    const finalPrice = totalAmount - discountAmount;
    const remainingAmount = finalPrice - advancePaid - additionalAmounts;

    // Validate required fields based on eventType
    if (eventType === "Marriage" && (!groom || !bride)) {
        res.status(400);
        throw new Error("Groom and Bride names are required for Marriage events.");
    }

    // Check if startDate is before or the same as endDate
    if (new Date(startDate) > new Date(endDate)) {
        res.status(400);
        throw new Error(`${startDate} must be the same or before the ${endDate}.`);
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
    if (checkDetails?.isRequired) {
        const { bankName, checkNumber, remark } = checkDetails;
        if (!bankName || !checkNumber || !remark) {
            res.status(400);
            throw new Error("Missing required check details.");
        }
    }
    // Create a new booking
    const newBooking = new Booking({
        venueType,
        eventType,
        groom,
        bride,
        customerName,
        customerNumber,
        customerAddress,
        startDate,
        endDate,
        packageType,
        items,
        advancePaid,
        additionalAmounts,
        remainingAmount,
        totalAmount,
        discountAmount,
        finalPrice,
        cateringOption,
        GetPackageOption,
        checkDetails,
        cateringItems: cateringOption === "yes" ? cateringItems : [],
        GetPackageItems: GetPackageOption === "yes" ? GetPackageItems : [],
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
        console.error("Error:", error); // Logs the complete error
        res.status(500).json({
            message: "Failed to create the booking.",
            error: error.message || error, // Sends exact error message
        });
    }

});


exports.getBookings = asyncHandler(async (req, res) => {
    try {
        const bookings = await Booking.find().select('-__v');
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500);
        throw new Error(`Failed to fetch bookings: ${error.message}`);
    }
});


exports.updateBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid or missing ID in request." });
    }

    // Temporary response to test route
    console.log(`Received ID: ${id}`);
    // Remove this after confirming correct ID retrieval
    // res.status(200).json({ message: `Received ID: ${id}` });

    const updateData = req.body;
    const existingBooking = await Booking.findById(id);
    if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found." });
    }

    // Other validation checks remain the same

    try {
        const updatedBooking = await Booking.findByIdAndUpdate(
            id,
            updateData,
            { new: true } // Return updated document
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        res.status(200).json({
            message: "Booking updated successfully!",
            booking: updatedBooking,
        });
    } catch (error) {
        res.status(500).json({ message: `Failed to update booking: ${error.message}` });
    }
});

exports.deleteBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const deletedBooking = await Booking.findByIdAndDelete(id);

        if (!deletedBooking) {
            res.status(404);
            throw new Error("Booking not found.");
        }

        res.status(200).json({
            message: "Booking deleted successfully!",
        });
    } catch (error) {
        res.status(500);
        throw new Error(`Failed to delete booking: ${error.message}`);
    }
});
