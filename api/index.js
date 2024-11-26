// api/index.js
require('dotenv').config();
const express = require('express');
const { Client } = require('pg');
const cors = require('cors');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'https://haqdarshak-assignment.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// PostgreSQL client setup
const client = new Client({
  connectionString: process.env.DB_URI,
});

// Connect to database
let isConnected = false;
async function connectToDatabase() {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
      console.log('Connected to Supabase PostgreSQL database');
    } catch (err) {
      console.error('Connection error', err.stack);
    }
  }
}

// API Routes
app.post('/api/users', async (req, res) => {
  await connectToDatabase();
  
  const { name, gender, dob, age, mobile_number, address_state, address_district, address_pin_code } = req.body;

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

app.get('/api/users', async (req, res) => {
  await connectToDatabase();
  
  try {
    const result = await client.query('SELECT * FROM users');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Export the Express API
module.exports = app;