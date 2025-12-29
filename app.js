const express = require("express");
const app = express();
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler")
const dbConnect = require("./db/connect");
require("dotenv").config();


app.use(cors({
  origin: "http://127.0.0.1:3030"
}));

app.use(express.json());

app.use("/api", require("./routes"));

app.use(errorHandler)

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async() => {
    await dbConnect(MONGO_URI);
    app.listen(PORT, () => {
      console.log("Server Running on Port ", PORT);
    });
}

startServer();