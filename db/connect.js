const mongoose = require("mongoose");

const dbConnect = async (mongoUri) => {
    try {
        // Log this to see if it's reading the variable!
        console.log("Connecting to Mongo URL:", mongoUri); 

        // Use the passed mongoUri parameter
        await mongoose.connect(mongoUri); 

        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
        process.exit(1);
    }
};

module.exports = dbConnect;