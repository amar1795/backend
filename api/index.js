// api/users.js
import { Client } from 'pg';

// Initialize PostgreSQL client
const client = new Client({
  connectionString: process.env.DB_URI,
});

// Track connection state
let isConnected = false;

async function connectToDatabase() {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
      console.log('Connected to database');
    } catch (err) {
      console.error('Connection error', err);
      throw err;
    }
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://haqdarshak-assignment.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Connect to database
    await connectToDatabase();

    switch (req.method) {
      case 'GET':
        const result = await client.query('SELECT * FROM users');
        res.status(200).json(result.rows);
        break;

      case 'POST':
        const { name, gender, dob, age, mobile_number, address_state, address_district, address_pin_code } = req.body;
        
        const insertResult = await client.query(
          `INSERT INTO users 
          (name, gender, dob, age, mobile_number, address_state, address_district, address_pin_code)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [name, gender, dob || null, age || null, mobile_number, address_state, address_district, address_pin_code]
        );
        
        res.status(201).json({ message: 'User added successfully', user: insertResult.rows[0] });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}