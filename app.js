const express = require('express');
const app = express();
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const dbConnect = require('./db/connect');
const errorHandler = require('./middlewares/errorHandler');
// Config
const apiRouter = require('./routes/index');


dotenv.config();

// Middleware
app.use(express.json());
app.use(morgan('tiny'));
app.use(cors());

// Basic Route
app.get('/', (req, res) => {
    res.send('Online Judge API is running...');
});


// Start Server
const start = async () => {
    try {
        // Connect to DB
        await dbConnect(process.env.MONGO_URI);
        app.listen(5000, () => {
            console.log('Server is running on port 5000');
        });
    } catch (error) {
        console.log(error);
    }
}
// Mount API Routes
app.use('/api', apiRouter);
app.use(errorHandler);
start();