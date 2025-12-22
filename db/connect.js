const mongoose = require("mongoose");

const dbConnect = async (URL) => {
    console.log(URL);
    await mongoose.connect(URL, {})
    console.log('Connected to Database');
}

module.exports = dbConnect;