require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allows cross-origin requests (from Google Sites)
app.use(express.json()); // Parses incoming JSON requests

// Database Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes); // All our routes will be prefixed with /api

// Health check endpoint
app.get('/', (req, res) => {
    res.send('iHub Backend is running!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});