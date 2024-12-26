const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser")
require("dotenv").config({ path: "./.env" });
const path = require("path");


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL);

const app = express();
app.use(express.static(path.join(__dirname, "dist")));


// Middlewares
app.use(express.json());
app.use(cors({
    // origin: "https://shivneri.onrender.com", // Adjust according to your frontend URL
    origin: "http://localhost:5173", // Adjust according to your frontend URL
    credentials: true
}));
app.use(cookieParser())

app.use("/api/auth", require("./routes/authRoute"))

// Routes for both booking types
app.use("/api/booking", require("./routes/booking.routes")); // Route for general bookings

// Catch-all for unmatched routes
app.use("*", (req, res) => {

    res.sendFile(path.join(__dirname, "dist", "index.html"))
});


// Global error handler
app.use((err, req, res, next) => {
    console.log(err);
    return res.status(500).json({ message: err.message || "Something went wrong" });
});

// Server start
mongoose.connection.once("open", () => {
    console.log("Mongoose Connected");
    app.listen(process.env.PORT, () => {
        console.log("Server running");
    });
});
