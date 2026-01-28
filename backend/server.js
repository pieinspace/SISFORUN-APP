const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Test Endpoint
app.get("/", (req, res) => {
    res.send("SisfoRun API is functional");
});

// Test DB Connection
app.get("/test-db", async (req, res) => {
    try {
        const result = await db.query("SELECT NOW()");
        res.json({ success: true, time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================
// AUTH
// =====================================
app.post("/api/auth/login", async (req, res) => {
    const { nrp, password } = req.body;

    if (!nrp || !password) {
        return res.status(400).json({ error: "NRP and password required" });
    }

    try {
        // Ambil user dari tabel login (sesuai DB yang kamu buat)
        const result = await db.query(
            "SELECT id, nrp, password_hash, role, is_active FROM login WHERE nrp = $1",
            [nrp]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: "Account disabled" });
        }

        // Compare bcrypt
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Kembalikan user info tanpa password_hash
        return res.json({
            user: { id: user.id, nrp: user.nrp, role: user.role },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
    }
});

// (OPSIONAL) Seed user mock langsung dari API (biar gampang testing)
// Pakai sekali aja, nanti kamu bisa hapus endpoint ini kalau sudah selesai dev.
app.post("/api/auth/seed", async (req, res) => {
    const { nrp, password, role } = req.body;

    if (!nrp || !password || !role) {
        return res
            .status(400)
            .json({ error: "nrp, password, role required (role: militer/asn)" });
    }

    if (!["militer", "asn"].includes(role)) {
        return res.status(400).json({ error: "role must be 'militer' or 'asn'" });
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        const result = await db.query(
            `INSERT INTO login (nrp, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, nrp, role, is_active, created_at`,
            [nrp, hash, role]
        );

        return res.status(201).json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        // kalau nrp duplicate
        if (err.code === "23505") {
            return res.status(409).json({ error: "NRP already exists" });
        }
        return res.status(500).json({ error: "Failed to seed user" });
    }
});

// =====================================
// LEADERBOARD (tetap pakai users + run_sessions seperti punyamu)
// =====================================
app.get("/api/leaderboard", async (req, res) => {
    try {
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

        const leaderboard = result.rows.map((row) => ({
            id: String(row.id),
            name: row.name,
            nrp: row.nrp,
            distanceKm: parseFloat(row.distanceKm),
            paceMinPerKm: parseFloat(row.paceMinPerKm),
        }));

        res.json(leaderboard);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});

// =====================================
// RUNS
// =====================================
app.post("/api/runs", async (req, res) => {
    const { userId, distanceKm, durationSec, route } = req.body;

    try {
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
        res.status(500).json({ error: "Failed to save run" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
