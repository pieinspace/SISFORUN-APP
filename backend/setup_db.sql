-- 1. Table Users
-- Menimpan data login dan role user
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    nrp VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL, -- Di production harus di-hash!
    role VARCHAR(20) DEFAULT 'militer', -- 'militer' atau 'asn'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table Run Sessions
-- Menyimpan riwayat lari user
CREATE TABLE run_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    distance_km FLOAT NOT NULL,
    duration_sec INT NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    route_json TEXT -- Menyimpan koordinat rute (JSON string)
);

-- 3. Data Dummy (Contoh)
INSERT INTO users (name, nrp, password, role) VALUES 
('Andi Pratama', '123456', 'rahasia', 'militer'),
('Budi Santoso', '111222', 'rahasia', 'asn');
