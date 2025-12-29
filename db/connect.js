const mongoose = require("mongoose");

const dbConnect = async () => {
    try {
        // Log this to see if it's reading the variable!
        console.log("Connecting to Mongo URL:", process.env.MONGO_URL); 

        // Ensure process.env.MONGO_URL matches your .env file
        await mongoose.connect(process.env.MONGO_URL); 

        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
        process.exit(1);
    }
};

module.exports = dbConnect;