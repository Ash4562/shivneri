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
        notes,
        customerNumber2,
        customerNumber,
        customerAddress,
        startDate,
        endDate,
        packageType,
        items = [],
        advancePaid = 0,
        additionalAmounts = [],
        discountAmount = 0,
        totalAmount,
        checkDetails,
        cateringOption,
        cateringItems = [],
        GetPackageOption,
        GetPackageItems = [],
        paymentStatus = "Booked",
    } = req.body;

    console.log(req.body);

    // Calculate derived fields
    const additionalAmountsTotal = Array.isArray(additionalAmounts)
        ? additionalAmounts.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
        : parseFloat(additionalAmounts) || 0;

    const formattedAdditionalAmounts = Array.isArray(additionalAmounts)
        ? additionalAmounts
        : [{ amount: parseFloat(additionalAmounts) || 0 }];

    const finalPrice = parseFloat(totalAmount || 0) - parseFloat(discountAmount || 0);
    const remainingAmount = (
        parseFloat(finalPrice || 0) -
        parseFloat(advancePaid || 0) -
        parseFloat(additionalAmountsTotal || 0)
    ).toFixed(2); // Ensure it's a string with two decimal places

    // Validate required fields based on eventType
    if (eventType === "Marriage" && (!groom || !bride)) {
        res.status(400).json({ message: "Groom and Bride names are required for Marriage events." });
        return;
    }

    // Validate start and end dates
    if (new Date(startDate) > new Date(endDate)) {
        res.status(400).json({ message: `${startDate} must be the same or before ${endDate}.` });
        return;
    }

    // Check for date conflicts with existing bookings
    const existingBooking = await Booking.findOne({
        $and: [
            {
                $or: [
                    {
                        startDate: { $lte: new Date(startDate) },
                        endDate: { $gte: new Date(startDate) },
                    },
                    {
                        startDate: { $lte: new Date(endDate) },
                        endDate: { $gte: new Date(endDate) },
                    },
                    {
                        startDate: new Date(startDate),
                        endDate: new Date(endDate),
                    },
                ],
            },
            { venueType: { $in: ["Lawn", "Banquet", "Both"] } },
            { paymentStatus: { $ne: "Enquiry" } },
        ],
    });

    if (existingBooking) {
        if (existingBooking.venueType === "Both") {
            res.status(400).json({ message: `The venue is fully booked on ${startDate} for "Both".` });
            return;
        } else if (venueType === "Both") {
            res.status(400).json({
                message: `The venue is already booked for "${existingBooking.venueType}" on ${startDate}.`,
            });
            return;
        } else if (
            (existingBooking.venueType === "Lawn" && venueType === "Banquet") ||
            (existingBooking.venueType === "Banquet" && venueType === "Lawn")
        ) {
            // Allow Lawn and Banquet to be booked separately
        } else {
            res.status(400).json({
                message: `The venue is already booked for "${existingBooking.venueType}" on ${startDate}.`,
            });
            return;
        }
    }

    // Validate other required fields
    if (!packageType || !venueType || !eventType || !customerName || !customerNumber || !startDate || !endDate) {
        res.status(400).json({ message: "All required fields must be filled." });
        return;
    }

    if (checkDetails?.isRequired) {
        const { bankName, checkNumber, remark } = checkDetails;
        if (!bankName || !checkNumber || !remark) {
            res.status(400).json({ message: "Missing required check details." });
            return;
        }
    }

    // Create a new booking
    const newBooking = new Booking({
        venueType,
        eventType,
        groom,
        bride,
        customerName,
        customerNumber2,
        customerNumber,
        notes,
        customerAddress,
        startDate,
        endDate,
        packageType,
        items,
        advancePaid,
        additionalAmounts: formattedAdditionalAmounts,
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

    // Save the booking
    try {
        const savedBooking = await newBooking.save();
        res.status(201).json({
            message: "Booking created successfully!",
            booking: savedBooking,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            message: "Failed to create the booking.",
            error: error.message || error,
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

    const updateData = req.body;

    // Fetch the existing booking
    const existingBooking = await Booking.findById(id);
    if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found." });
    }

    const { startDate, endDate, venueType } = updateData;

    // Validate startDate and endDate
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ message: `${startDate} must be the same or before ${endDate}.` });
    }

    // Check for date conflicts with other bookings
    const conflictingBooking = await Booking.findOne({
        $and: [
            {
                // Check for overlapping dates
                $or: [
                    {
                        startDate: { $lte: new Date(startDate) },
                        endDate: { $gte: new Date(startDate) },
                    },
                    {
                        startDate: { $lte: new Date(endDate) },
                        endDate: { $gte: new Date(endDate) },
                    },
                    {
                        startDate: new Date(startDate), // Matches the exact start date
                        endDate: new Date(endDate), // Matches the exact end date
                    },
                ],
            },
            {
                venueType: { $in: ["Lawn", "Banquet", "Both"] },
            },
            {
                _id: { $ne: id }, // Exclude the current booking from the check
            },
            {
                paymentStatus: { $ne: "Enquiry" }, // Exclude enquiry-only bookings
            },
        ],
    });

    if (conflictingBooking) {
        if (conflictingBooking.venueType === "Both") {
            return res.status(400).json({ message: `The venue is fully booked on ${startDate} for "Both".` });
        } else if (venueType === "Both") {
            return res.status(400).json({
                message: `The venue is already booked for "${conflictingBooking.venueType}" on ${startDate}.`,
            });
        } else if (
            (conflictingBooking.venueType === "Lawn" && venueType === "Banquet") ||
            (conflictingBooking.venueType === "Banquet" && venueType === "Lawn")
        ) {
            // Allow Lawn and Banquet to be booked separately
        } else {
            return res.status(400).json({
                message: `The venue is already booked for "${conflictingBooking.venueType}" on ${startDate}.`,
            });
        }
    }

    // Update the booking
    try {
        const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, {
            new: true, // Return the updated document
        });

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

