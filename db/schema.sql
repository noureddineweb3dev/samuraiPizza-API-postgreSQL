CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  address TEXT,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT email_or_phone_check CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'staff',
  full_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id), -- Changed from user_id
  customer VARCHAR(255),
  phone VARCHAR(255),
  address VARCHAR(255),
  priority BOOLEAN,
  order_price REAL,
  priority_price REAL,
  total_price REAL,
  status VARCHAR(50),
  items JSONB,
  estimated_delivery TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit_price REAL NOT NULL,
  image_url VARCHAR(255),
  ingredients JSONB,
  category VARCHAR(50),
  spicy BOOLEAN DEFAULT FALSE,
  vegetarian BOOLEAN DEFAULT FALSE,
  bestseller BOOLEAN DEFAULT FALSE,
  sold_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
