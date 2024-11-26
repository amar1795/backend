require('dotenv').config(); // Load .env variables into process.env
const express = require('express');
const { Client } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.DB_PORT || 5000;

// Middleware to parse JSON requests
app.use(express.json());

 // Enable CORS for all routes
 app.use(cors({
    origin: 'http://localhost:3000',  // or '*' for all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }));

//   // Default Next.js route handler
//   app.all('*', (req, res) => {
//     return handle(req, res);
//   });


// PostgreSQL client setup
const client = new Client({
    connectionString: process.env.DB_URI, // Replace with your Supabase connection string
});

client.connect()
    .then(() => console.log('Connected to Supabase PostgreSQL database'))
    .catch(err => console.error('Connection error', err.stack));


// POST request to add user data
app.post('/users', async (req, res) => {
    const { name, gender, dob, age, mobile_number, address_state, address_district, address_pin_code } = req.body;

    console.log('Request body:', req.body);

    // Ensure either dob or age is provided but not both
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
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


