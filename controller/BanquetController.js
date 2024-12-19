const asyncHandler = require("express-async-handler");
const BanquetBooking = require("../models/BanquetModel"); // Import the BanquetBooking model

// Define thali prices for banquet bookings (optional, you can remove if not needed)
const banquetThaliPrices = {
    Normal: 300,
    Supreme: 600,
    Deluxe: 900,
};

// Create a new banquet booking
exports.createBanquetBooking = asyncHandler(async (req, res) => {
    const {
        customerName,
        customerNumber,
        startDate,
        endDate,
        eventType,
        hallCharges = 0,
        items = [],
        selectedThali,
        numberOfPeople = 0,
        discount = 0,
        paymentStatus,
        eventTiming,
    } = req.body;

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
        return res.status(400).json({ message: "Invalid start or end date format." });
    }

    if (parsedEndDate < parsedStartDate) {
        return res.status(400).json({ message: "End date must be after or equal to the start date." });
    }

    const existingBanquetBooking = await BanquetBooking.findOne({
        eventDate: { $elemMatch: { $gte: parsedStartDate, $lte: parsedEndDate } },
        eventTiming,
    });

    if (existingBanquetBooking) {
        return res.status(400).json({
            message: "A banquet booking already exists for the selected ${eventTiming} slot on this date.",
        });
    }

    const thaliPrice = banquetThaliPrices[selectedThali];
    if (!thaliPrice) {
        return res.status(400).json({ message: "Invalid thali type selected." });
    }
    const cateringTotal = thaliPrice * numberOfPeople;
    const itemTotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
    const initialTotal = Number(hallCharges) + itemTotal + cateringTotal;
    const discountAmount = (discount / 100) * initialTotal;
    const finalPrice = initialTotal - discountAmount;

    const newBanquetBooking = new BanquetBooking({
        customerName,
        customerNumber,
        eventDate: [parsedStartDate, parsedEndDate],
        eventType,
        hallCharges: Number(hallCharges),
        selectedThali,
        thaliPrice,
        numberOfPeople,
        items,
        totalPrice: initialTotal,
        discount,
        finalPrice,
        eventTiming,
        paymentStatus,
    });

    try {
        const savedBanquetBooking = await newBanquetBooking.save();
        res.status(201).json({ message: "Banquet booking successfully created!", banquetBooking: savedBanquetBooking });
    } catch (error) {
        res.status(500).json({ message: "Failed to create banquet booking.", error: error.message });
    }
});

// Get all banquet bookings
exports.getBanquetBookings = asyncHandler(async (req, res) => {
    try {
        const banquetBookings = await BanquetBooking.find();
        res.status(200).json(banquetBookings);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch banquet bookings.", error: error.message });
    }
});

// Get a specific banquet booking by ID
exports.getBanquetBookingById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const banquetBooking = await BanquetBooking.findById(id);
        if (!banquetBooking) {
            return res.status(404).json({ message: "Banquet booking not found." });
        }
        res.status(200).json(banquetBooking);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch banquet booking.", error: error.message });
    }
});

// Update an existing banquet booking (Only paymentStatus is allowed to be updated)
exports.updateBanquetBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!["Pending", "Successful"].includes(paymentStatus)) {
        return res.status(400).json({ message: "Invalid payment status. It must be 'Pending' or 'Successful'." });
    }

    try {
        const banquetBooking = await BanquetBooking.findById(id);
        if (!banquetBooking) {
            return res.status(404).json({ message: "Banquet booking not found." });
        }

        banquetBooking.paymentStatus = paymentStatus;
        const updatedBanquetBooking = await banquetBooking.save();
        res.status(200).json({ message: "Payment status updated successfully!", banquetBooking: updatedBanquetBooking });
    } catch (error) {
        res.status(500).json({ message: "Failed to update banquet booking.", error: error.message });
    }
});

// Delete a banquet booking by ID
exports.deleteBanquetBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const banquetBooking = await BanquetBooking.findById(id);
        if (!banquetBooking) {
            return res.status(404).json({ message: "Banquet booking not found." });
        }

        // Use deleteOne instead of remove
        await BanquetBooking.deleteOne({ _id: id });

        res.status(200).json({ message: "Banquet booking deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete banquet booking.", error: error.message });
    }
});