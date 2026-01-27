const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Test Endpoint
app.get('/', (req, res) => {
    res.send('SisfoRun API is functional');
});

// Test DB Connection
app.get('/test-db', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Auth Routes ---
// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
    const { nrp, password } = req.body;
    if (!nrp || !password) {
        return res.status(400).json({ error: 'NRP and password required' });
    }

    try {
        // WARNING: In production, use hashed passwords (bcrypt)! This is plain text for demo.
        // Adjust table name 'users' and columns matches your schema
        const result = await db.query('SELECT * FROM users WHERE nrp = $1', [nrp]);

        const user = result.rows[0];

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user info sans password
        const { password: _, ...userInfo } = user;
        res.json({ user: userInfo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Leaderboard Route ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        // Aggregation query: Calculate total distance and avg pace per user
        // Assuming 'users' table has 'name' and 'nrp'
        // 'run_sessions' has 'distance_km', 'duration_sec', 'user_id'
        const query = `
      SELECT 
        u.id, 
        u.name, 
        u.nrp, 
        COALESCE(SUM(r.distance_km), 0) as "distanceKm",
        CASE 
           WHEN SUM(r.distance_km) > 0 THEN (SUM(r.duration_sec) / 60.0) / SUM(r.distance_km)
           ELSE 0
        END as "paceMinPerKm"
      FROM users u
      LEFT JOIN run_sessions r ON u.id = r.user_id
      GROUP BY u.id
      ORDER BY "distanceKm" DESC
      LIMIT 50
    `;

        const result = await db.query(query);

        // Format numeric values if needed (postgres sum can return string)
        const leaderboard = result.rows.map(row => ({
            id: String(row.id),
            name: row.name,
            nrp: row.nrp,
            distanceKm: parseFloat(row.distanceKm),
            paceMinPerKm: parseFloat(row.paceMinPerKm)
        }));

        res.json(leaderboard);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// --- Run Routes ---
app.post('/api/runs', async (req, res) => {
    const { userId, distanceKm, durationSec, route } = req.body;

    try {
        // Ensure you have a table 'run_sessions'
        const query = `
      INSERT INTO run_sessions (user_id, distance_km, duration_sec, date_created, route_json)
      VALUES ($1, $2, $3, NOW(), $4)
      RETURNING *
    `;
        const values = [userId, distanceKm, durationSec, JSON.stringify(route)];
        const result = await db.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save run' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
