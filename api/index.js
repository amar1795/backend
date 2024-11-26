// api/users.js
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DB_URI,
});

let isConnected = false;

async function connectToDatabase() {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
      console.log('Connected to database');
    } catch (err) {
      console.error('Connection error', err.stack);
    }
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://haqdarshak-assignment.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  await connectToDatabase();

  if (req.method === 'POST') {
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
      return res.status(201).json({ message: 'User added successfully', user: result.rows[0] });
    } catch (error) {
      console.error('Error inserting data:', error);
      return res.status(500).json({ error: 'Failed to add user' });
    }
  }

  if (req.method === 'GET') {
    try {
      const result = await client.query('SELECT * FROM users');
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
};