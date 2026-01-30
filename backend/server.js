const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const db = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.INTEGRATION_SECRET || "fallback-secret-key";

app.use(cors());
app.use(express.json());

// =====================================
// RATE LIMITING
// =====================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 5, // max 5 attempts per window
    message: { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
    standardHeaders: true,
    legacyHeaders: false,
});

// =====================================
// AUTHENTICATION MIDDLEWARE
// =====================================
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token tidak ditemukan" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, nrp, role }
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token tidak valid atau expired" });
    }
}

// Middleware untuk validasi userId match dengan token
function validateUserAccess(req, res, next) {
    const { userId } = req.params;

    // Validate userId is a number
    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ error: "userId harus berupa angka" });
    }

    // Check user can only access their own data
    if (req.user.id !== parseInt(userId)) {
        return res.status(403).json({ error: "Akses ditolak: Anda hanya dapat mengakses data milik sendiri" });
    }

    next();
}

// =====================================
// PUBLIC ENDPOINTS
// =====================================

// Test Endpoint
app.get("/", (req, res) => {
    res.send("Forza API is functional");
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
app.post("/api/auth/login", loginLimiter, async (req, res) => {
    const { nrp, password } = req.body;

    if (!nrp || !password) {
        return res.status(400).json({ error: "NRP and password required" });
    }

    try {
        // Join login dengan users untuk dapat nama, pangkat, kesatuan
        // PENTING: Ambil u.id (user_id) bukan l.id (login_id) agar match dengan run_sessions
        const result = await db.query(
            `SELECT l.id as login_id, l.nrp, l.password_hash, l.role, l.is_active, 
                    u.id as user_id, u.name, u.pangkat, u.kesatuan
             FROM login l
             LEFT JOIN users u ON l.nrp = u.nrp
             WHERE l.nrp = $1`,
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

        // PENTING: Gunakan user_id (dari tabel users), bukan login_id
        const userId = user.user_id || user.login_id; // fallback ke login_id jika user_id null

        // Generate JWT token dengan user_id yang benar
        const token = jwt.sign(
            { id: userId, nrp: user.nrp, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Kembalikan user info dengan user_id yang benar + token
        return res.json({
            user: {
                id: userId,
                nrp: user.nrp,
                role: user.role,
                name: user.name || `User ${user.nrp}`,
                pangkat: user.pangkat || '-',
                kesatuan: user.kesatuan || '-'
            },
            token: token,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
    }
});

// (OPSIONAL) Seed user mock langsung dari API (biar gampang testing)
// Hanya aktif di development mode
if (process.env.NODE_ENV !== 'production') {
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
}

// =====================================
// CHANGE PASSWORD
// =====================================
app.post("/api/auth/change-password", async (req, res) => {
    const { nrp, oldPassword, newPassword } = req.body;

    if (!nrp || !oldPassword || !newPassword) {
        return res.status(400).json({ error: "All fields required" });
    }

    try {
        // 1. Ambil hash password lama dari DB
        const result = await db.query(
            "SELECT password_hash FROM login WHERE nrp = $1",
            [nrp]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = result.rows[0];

        // 2. Cek apakah password lama benar
        const match = await bcrypt.compare(oldPassword, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: "Password lama salah" });
        }

        // 3. Hash password baru dan update
        const newHash = await bcrypt.hash(newPassword, 10);
        await db.query(
            "UPDATE login SET password_hash = $1 WHERE nrp = $2",
            [newHash, nrp]
        );

        res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update password" });
    }
});

// =====================================
// LEADERBOARD (bulan ini saja - reset setiap bulan)
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
        AND r.date_created >= date_trunc('month', CURRENT_DATE)
        AND r.date_created < date_trunc('month', CURRENT_DATE) + interval '1 month'
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
// WEEKLY STATS (untuk target 14km per minggu)
// =====================================
app.get("/api/weekly-stats/:userId", authMiddleware, validateUserAccess, async (req, res) => {
    const { userId } = req.params;

    try {
        // Ambil total jarak minggu ini (Senin-Minggu)
        const query = `
            SELECT COALESCE(SUM(distance_km), 0) as total_km
            FROM run_sessions
            WHERE user_id = $1
              AND date_created >= date_trunc('week', CURRENT_DATE)
              AND date_created < date_trunc('week', CURRENT_DATE) + interval '1 week'
        `;
        const result = await db.query(query, [userId]);

        res.json({
            weeklyDistanceKm: parseFloat(result.rows[0].total_km),
            targetKm: 14,
            weekStart: new Date(Date.now() - (new Date().getDay() - 1) * 86400000).toISOString().split('T')[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch weekly stats" });
    }
});

// =====================================
// ALL-TIME STATS (tidak pernah reset)
// =====================================
app.get("/api/alltime-stats/:userId", authMiddleware, validateUserAccess, async (req, res) => {
    const { userId } = req.params;

    try {
        const query = `
            SELECT 
                COALESCE(SUM(distance_km), 0) as total_km,
                COALESCE(COUNT(*), 0) as total_runs,
                CASE 
                    WHEN SUM(distance_km) > 0 THEN (SUM(duration_sec) / 60.0) / SUM(distance_km)
                    ELSE 0
                END as avg_pace
            FROM run_sessions
            WHERE user_id = $1
        `;
        const result = await db.query(query, [userId]);
        const row = result.rows[0];

        res.json({
            totalKm: parseFloat(row.total_km),
            totalRuns: parseInt(row.total_runs),
            avgPace: parseFloat(row.avg_pace)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch all-time stats" });
    }
});

// =====================================
// RUNS
// =====================================

// GET - Ambil riwayat lari user (bulan ini saja)
app.get("/api/runs/:userId", authMiddleware, validateUserAccess, async (req, res) => {
    const { userId } = req.params;

    try {
        // Hanya ambil data bulan ini
        const query = `
            SELECT id, user_id, distance_km, duration_sec, date_created, route_json
            FROM run_sessions
            WHERE user_id = $1
              AND date_created >= date_trunc('month', CURRENT_DATE)
              AND date_created < date_trunc('month', CURRENT_DATE) + interval '1 month'
            ORDER BY date_created DESC
            LIMIT 50
        `;
        const result = await db.query(query, [userId]);

        const runs = result.rows.map((row) => ({
            id: String(row.id),
            date: row.date_created,
            distanceKm: parseFloat(row.distance_km),
            durationSec: parseInt(row.duration_sec),
            route: row.route_json ? JSON.parse(row.route_json) : [],
        }));

        res.json(runs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch runs" });
    }
});

// POST - Simpan run baru (dilindungi auth)
app.post("/api/runs", authMiddleware, async (req, res) => {
    // Gunakan user.id dari token untuk keamanan (bukan dari body)
    const userId = req.user.id;
    const { distanceKm, durationSec, route } = req.body;

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
