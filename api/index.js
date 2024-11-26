require('dotenv').config();
const express = require('express');
const { Client } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.DB_PORT || 5000;

// Middleware to parse JSON requests
app.use(express.json());

// CORS configuration
const allowedOrigins = [
  'https://haqdarshak-assignment.vercel.app',    // Your frontend URL
  'https://haqdarshaqbackend.vercel.app',        // Your backend URL
  'http://localhost:3000'                        // Local development
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// PostgreSQL client setup
const client = new Client({
    connectionString: process.env.DB_URI,
});

client.connect()
    .then(() => console.log('Connected to Supabase PostgreSQL database'))
    .catch(err => console.error('Connection error', err.stack));

// POST request to add user data
app.post('/users', async (req, res) => {
    const { name, gender, dob, age, mobile_number, address_state, address_district, address_pin_code } = req.body;

    console.log('Request body:', req.body);

    if ((dob && age) || (!dob && !age)) {
        return res.status(400).json({ error: 'Provide either DOB or Age, but not both.' });
    }

    try {
        const result = await client.query(
            `INSERT INTO users 
            (name, gender, dob, age, mobile_number, address_state, address_district, address_pin_code)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [name, gender, dob || null, age || null, mobile_number, address_state, address_district, address_pin_code]
        );
        res.status(201).json({ message: 'User added successfully', user: result.rows[0] });
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ error: 'Failed to add user' });
    }
});

// GET request to fetch all user data
app.get('/users', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Add a health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start the server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;