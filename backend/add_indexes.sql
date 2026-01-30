-- Script untuk menambahkan indexes dan mempercepat queries
-- Jalankan: psql -d sisforun -f add_indexes.sql

-- Index untuk mempercepat login (lookup by nrp)
CREATE INDEX IF NOT EXISTS idx_login_nrp ON login(nrp);
CREATE INDEX IF NOT EXISTS idx_users_nrp ON users(nrp);

-- Index untuk mempercepat queries run_sessions
-- Composite index untuk user_id dan date_created (paling sering digunakan)
CREATE INDEX IF NOT EXISTS idx_run_sessions_user_date ON run_sessions(user_id, date_created);

-- Partial index untuk query leaderboard bulanan (lebih efisien)
CREATE INDEX IF NOT EXISTS idx_run_sessions_date ON run_sessions(date_created);

-- Analyze tables setelah menambahkan indexes
ANALYZE login;
ANALYZE users;
ANALYZE run_sessions;
