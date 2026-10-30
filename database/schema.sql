-- =====================================================================
-- FATAKA MART - DATABASE SCHEMA & INITIAL DEMO SEED DATA
-- Target Database: PostgreSQL 14+ / 16+ / 18+
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP TABLES IF EXIST (IN CORRECT DEPENDENCY ORDER)
DROP TABLE IF EXISTS bill_items CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS shop_inventories CASCADE;
DROP TABLE IF EXISTS base_products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS shops CASCADE;

-- 3. ENUM TYPES OR VARCHAR CONSTRAINTS
-- Roles: SUPER_ADMIN, OWNER, CUSTOMER
-- Customer Tiers: NORMAL, REGULAR, CLOSE
-- Payment Methods: CASH, UPI, CARD, CREDIT
-- Margin Alerts: GREEN, ORANGE, RED

-- =====================================================================
-- 4. TABLE CREATION
-- =====================================================================

-- SHOPS (Sibling branches)
CREATE TABLE shops (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    branch_code VARCHAR(30) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
    contact_phone VARCHAR(20) NOT NULL,
    default_overhead_percentage NUMERIC(5, 2) NOT NULL DEFAULT 25.00,
    gst_number VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- USERS (Super Admin, Shop Owners, Customers)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'OWNER', 'CUSTOMER')),
    shop_id BIGINT REFERENCES shops(id) ON DELETE SET NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    referred_by VARCHAR(150),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES (Phooljhadi, Chakras, Flower Pots, Malas, Sky Shots, etc.)
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(50) DEFAULT 'Sparkles',
    display_order INT NOT NULL DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- BASE PRODUCTS (Super Admin Master Catalog)
CREATE TABLE base_products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    company_name VARCHAR(120) NOT NULL,
    pack_description VARCHAR(100) NOT NULL,
    default_purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    default_selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    image_url_1 TEXT,
    image_url_2 TEXT,
    image_url_3 TEXT,
    safety_instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_base_product_name_company UNIQUE (name, company_name)
);

-- SHOP INVENTORY (Shop-specific pricing, confidential overhead, stock)
CREATE TABLE shop_inventories (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    base_product_id BIGINT NOT NULL REFERENCES base_products(id) ON DELETE RESTRICT,
    custom_name VARCHAR(200),
    purchase_price NUMERIC(10, 2) NOT NULL,             -- STRICTLY CONFIDENTIAL
    overhead_percentage NUMERIC(5, 2) NOT NULL DEFAULT 25.00,
    overhead_price NUMERIC(10, 2) NOT NULL,              -- STRICTLY CONFIDENTIAL: purchase_price + (purchase_price * overhead_pct / 100)
    selling_price NUMERIC(10, 2) NOT NULL,               -- Retail MRP for regular walk-in
    threshold_price NUMERIC(10, 2) NOT NULL,             -- Min floor protecting at least 50% profit: overhead_price * 1.50
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_shop_base_product UNIQUE (shop_id, base_product_id)
);

-- CUSTOMERS (Speed search by Mobile, Name, or Referred By; Tiered 1, 2, 3)
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT REFERENCES shops(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    address TEXT,
    referred_by VARCHAR(150),
    tier VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (tier IN ('NORMAL', 'REGULAR', 'CLOSE')),
    total_purchases_count INT NOT NULL DEFAULT 0,
    total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    outstanding_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_shop_mobile UNIQUE (shop_id, mobile_number)
);

-- BILLS (Speed Billing POS Orders)
CREATE TABLE bills (
    id BIGSERIAL PRIMARY KEY,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_mobile VARCHAR(20) NOT NULL,
    customer_tier VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'UPI', 'CARD', 'CREDIT')),
    overall_discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
    subtotal_mrp NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_savings_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    final_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    -- CONFIDENTIAL OWNER FIELDS (Never sent in customer/public DTOs)
    total_purchase_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_overhead_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    profit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    profit_margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    margin_alert_level VARCHAR(20) NOT NULL DEFAULT 'GREEN' CHECK (margin_alert_level IN ('GREEN', 'ORANGE', 'RED')),
    
    festive_greeting VARCHAR(255) DEFAULT 'Happy Diwali! Thank you for celebrating with Fataka Mart!',
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- BILL ITEMS (Individual Line Items on Bill)
CREATE TABLE bill_items (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    shop_inventory_id BIGINT REFERENCES shop_inventories(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    company_name VARCHAR(120),
    pack_description VARCHAR(100),
    
    -- CONFIDENTIAL TO OWNER
    purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    overhead_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- PUBLIC BILL VISIBLE FIELDS
    selling_price NUMERIC(10, 2) NOT NULL,             -- Line item MRP
    discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    final_rate NUMERIC(10, 2) NOT NULL,                -- Rate after discount
    quantity INT NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(12, 2) NOT NULL,                -- final_rate * quantity
    
    overhead_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 -- overhead_price * quantity (Confidential)
);

-- =====================================================================
-- 5. PERFORMANCE INDEXES
-- =====================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_shop_id ON users(shop_id);

CREATE INDEX idx_categories_display_order ON categories(display_order);
CREATE INDEX idx_base_products_category ON base_products(category_id);
CREATE INDEX idx_shop_inventories_shop ON shop_inventories(shop_id);
CREATE INDEX idx_shop_inventories_product ON shop_inventories(base_product_id);

CREATE INDEX idx_customers_search ON customers(mobile_number, full_name, referred_by);
CREATE INDEX idx_customers_shop ON customers(shop_id);

CREATE INDEX idx_bills_shop ON bills(shop_id);
CREATE INDEX idx_bills_created_at ON bills(created_at);
CREATE INDEX idx_bills_customer ON bills(customer_id);
CREATE INDEX idx_bill_items_bill_id ON bill_items(bill_id);

-- =====================================================================
-- 6. INITIAL DEMO SEED DATA
-- =====================================================================

-- 6.1 SHOPS (Sibling Branches)
INSERT INTO shops (id, name, branch_code, address, city, state, contact_phone, default_overhead_percentage, gst_number) VALUES
(1, 'Fataka Mart - Main Mega Store', 'FM-PUN-01', 'Shop 101, Market Yard, Swargate', 'Pune', 'Maharashtra', '+91 98765 43210', 25.00, '27AABCF1234M1Z2'),
(2, 'Fataka Mart - Station Branch', 'FM-PUN-02', 'Plot 45, Near Railway Station, Station Road', 'Pune', 'Maharashtra', '+91 98765 43211', 25.00, '27AABCF1234M1Z3'),
(3, 'Fataka Mart - Highway Hub', 'FM-MUM-01', 'Gala 12, Western Express Highway, Goregaon', 'Mumbai', 'Maharashtra', '+91 98765 43212', 30.00, '27AABCF1234M1Z4'),
(4, 'Fataka Mart - City Center', 'FM-NSK-01', 'College Road, Near Canada Corner', 'Nashik', 'Maharashtra', '+91 98765 43213', 20.00, '27AABCF1234M1Z5');

-- 6.2 USERS
-- Super Admin: npratikjagtap2704@gmail.com / Password: Admin@123 (BCrypt: $2a$10$wM0x4tF1nS0c0Zf/bE5h4OPcQ1aJtZ42pU4zFz5P/6R1kZ9L1kZ9.)
-- Shop Owner 1: owner1@fatakamart.com / Password: Owner@123
-- Customer 1: customer@fatakamart.com / Password: Customer@123
INSERT INTO users (id, email, password_hash, full_name, mobile, role, shop_id, is_enabled) VALUES
(1, 'npratikjagtap2704@gmail.com', '$2a$10$7XyHjXzZ.vE0jWqNqC3Vw.6nK4OqH0u3vF4yE2lE5jF1wM5hP2iSm', 'Pratik Jagtap (Super Admin)', '+91 91122 33445', 'SUPER_ADMIN', NULL, TRUE),
(2, 'owner1@fatakamart.com', '$2a$10$7XyHjXzZ.vE0jWqNqC3Vw.6nK4OqH0u3vF4yE2lE5jF1wM5hP2iSm', 'Milind Patil (Pune Main Owner)', '+91 98220 12345', 'OWNER', 1, TRUE),
(3, 'owner2@fatakamart.com', '$2a$10$7XyHjXzZ.vE0jWqNqC3Vw.6nK4OqH0u3vF4yE2lE5jF1wM5hP2iSm', 'Sachin Shinde (Station Owner)', '+91 98220 54321', 'OWNER', 2, TRUE),
(4, 'rajesh.patel@gmail.com', '$2a$10$7XyHjXzZ.vE0jWqNqC3Vw.6nK4OqH0u3vF4yE2lE5jF1wM5hP2iSm', 'Rajesh Patel', '+91 98900 11223', 'CUSTOMER', NULL, TRUE);

-- 6.3 CATEGORIES
INSERT INTO categories (id, name, slug, description, icon_name, display_order, image_url) VALUES
(1, 'Sparklers (Phooljhadi)', 'sparklers', 'Classic dazzling hand sparklers in gold, electric, and multi-colour variations.', 'Sparkles', 1, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'),
(2, 'Ground Chakras (Zameen Chakkar)', 'ground-chakras', 'Spinning circular firewheels generating brilliant golden and silver sparks.', 'Disc', 2, 'https://images.unsplash.com/photo-1576400883215-7083980b6197?w=600&auto=format&fit=crop&q=80'),
(3, 'Flower Pots (Koti / Anar)', 'flower-pots', 'Towering fountains of golden, silver, crackling, and tri-colour sparks.', 'Flame', 3, 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=600&auto=format&fit=crop&q=80'),
(4, 'Garland / Mala (Ladi Crackers)', 'garland-mala', 'Traditional rapid rhythm celebration string crackers (1000, 2000, 5000 Wala).', 'Layers', 4, 'https://images.unsplash.com/photo-1508717272800-9fff97da7e8f?w=600&auto=format&fit=crop&q=80'),
(5, 'Multi-Color Sky Shots', 'multi-color-sky-shots', 'Spectacular aerial cake repeaters firing brilliant bursts high into the night sky.', 'Rocket', 5, 'https://images.unsplash.com/photo-1533230408708-8f9f91d12368?w=600&auto=format&fit=crop&q=80'),
(6, 'Fancy Novelty & Sound Crackers', 'fancy-novelty-sound', 'Hydro bombs, whistling sound crackers, roll caps, and kid-safe novelty items.', 'Zap', 6, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80');

-- 6.4 BASE PRODUCTS (Global Master Catalog)
INSERT INTO base_products (id, category_id, name, company_name, pack_description, default_purchase_price, default_selling_price, image_url_1, image_url_2, image_url_3, safety_instructions) VALUES
-- Sparklers
(1, 1, 'Electric Sparklers 10cm', 'Standard Fireworks', 'Box of 10 Pcs', 25.00, 60.00,
 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
 'https://images.unsplash.com/photo-1576400883215-7083980b6197?w=600&auto=format&fit=crop&q=80',
 NULL, 'Light at tip using agarbatti. Hold at arm length outdoors. Dip extinguished wire in water.'),
(2, 1, 'Deluxe Golden Sparklers 15cm', 'Standard Fireworks', 'Box of 10 Pcs', 45.00, 110.00,
 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
 NULL, NULL, 'Light individually in open area. Always supervise children.'),
(3, 1, 'Mega Tri-Color Colour Sparklers 30cm', 'Sony Fireworks', 'Box of 5 Pcs', 75.00, 180.00,
 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
 NULL, NULL, 'Extra long burning sparkler. Hold upright with steady grip outdoors.'),

-- Ground Chakras
(4, 2, 'Ground Chakra Special', 'Standard Fireworks', 'Box of 10 Pcs', 60.00, 150.00,
 'https://images.unsplash.com/photo-1576400883215-7083980b6197?w=600&auto=format&fit=crop&q=80',
 NULL, NULL, 'Place flat on smooth concrete or stone surface with fuse pointing up. Light and retreat 5 meters.'),
(5, 2, 'Chakra Deluxe Big Wheel', 'Coronation Fireworks', 'Box of 10 Pcs', 90.00, 220.00,
 'https://images.unsplash.com/photo-1576400883215-7083980b6197?w=600&auto=format&fit=crop&q=80',
 NULL, NULL, 'High speed spinning wheel. Never use on grass or carpet.'),

-- Flower Pots
(6, 3, 'Flower Pot Big (Anar Special)', 'Standard Fireworks', 'Box of 10 Pcs', 100.00, 250.00,
 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=600&auto=format&fit=crop&q=80',
 NULL, NULL, 'Place vertically on flat ground. Light fuse tip and step back 5 meters immediately.'),
(7, 3, 'Giant Colour Fountain Flower Pot', 'Sony Fireworks', 'Box of 5 Pcs', 140.00, 340.00,
 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=600&auto=format&fit=crop&q=80',
 NULL, NULL, 'Shoots dazzling multi-colour sparks up to 15 feet high.'),

-- Garland / Mala
(8, 4, '1000 Wala Red Mala String', 'Coronation Fireworks', '1 Roll Pack', 120.00, 300.00,
 'https://images.unsplash.com/photo-1508717272800-9fff97da7e8f?w=600&auto=format&fit=crop&q=80',
 NULL, NULL, 'Unroll completely on open ground away from vehicles and buildings. Light fuse end.'),
(9, 4, '5000 Wala Deluxe Celebration Mala', 'Standard Fireworks', '1 Jumbo Pack', 550.00, 1350.00,
 'https://images.unsplash.com/photo-1508717272800-9fff97da7e8f?w=600&auto=format&fit=crop&q=80',
 NULL, NULL, 'Long running celebration string. Maintain safe distance of at least 15 meters.'),

-- Sky Shots
(10, 5, '12 Shots Multi-Colour Aerial Cake', 'Standard Fireworks', '1 Box Cake', 180.00, 450.00,
 'https://images.unsplash.com/photo-1533230408708-8f9f91d12368?w=600&auto=format&fit=crop&q=80',
 NULL, NULL, 'Place box upright on flat firm ground. Support sides with bricks. Never lean over the tube.'),
(11, 5, '30 Shots Golden Willow Sky Splendour', 'Sony Fireworks', '1 Box Cake', 420.00, 1050.00,
 'https://images.unsplash.com/photo-1533230408708-8f9f91d12368?w=600&auto=format&fit=crop&q=80',
 NULL, NULL, 'Professional quality repeating aerial bursts. Clear overhead clearance of 30 meters required.'),

-- Fancy & Sound
(12, 6, 'Hydro Bomb Sound Blast', 'Standard Fireworks', 'Box of 10 Pcs', 80.00, 200.00,
 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
 NULL, NULL, 'Heavy sound cracker. Light fuse on ground and retreat immediately.');

-- 6.5 SHOP INVENTORY (Shop 1 - Pune Main Branch)
-- Overhead = 25%. Overhead Price = Purchase * 1.25. Threshold Price = Overhead Price * 1.50 (50% profit over overhead).
INSERT INTO shop_inventories (id, shop_id, base_product_id, custom_name, purchase_price, overhead_percentage, overhead_price, selling_price, threshold_price, stock_quantity, low_stock_threshold) VALUES
(1, 1, 1, 'Standard 10cm Electric Sparkler', 25.00, 25.00, 31.25, 60.00, 46.88, 150, 20),
(2, 1, 2, 'Standard 15cm Deluxe Sparkler', 45.00, 25.00, 56.25, 110.00, 84.38, 120, 20),
(3, 1, 3, 'Sony 30cm Tri-Color Sparkler', 75.00, 25.00, 93.75, 180.00, 140.63, 80, 15),
(4, 1, 4, 'Standard Ground Chakra Special', 60.00, 25.00, 75.00, 150.00, 112.50, 100, 15),
(5, 1, 5, 'Coronation Deluxe Big Chakra', 90.00, 25.00, 112.50, 220.00, 168.75, 75, 10),
(6, 1, 6, 'Standard Anar / Flower Pot Big', 100.00, 25.00, 125.00, 250.00, 187.50, 90, 15),
(7, 1, 7, 'Sony Giant Colour Fountain Anar', 140.00, 25.00, 175.00, 340.00, 262.50, 60, 10),
(8, 1, 8, 'Coronation 1000 Wala Red Mala', 120.00, 25.00, 150.00, 300.00, 225.00, 85, 10),
(9, 1, 9, 'Standard 5000 Wala Jumbo Mala', 550.00, 25.00, 687.50, 1350.00, 1031.25, 30, 5),
(10, 1, 10, 'Standard 12 Shots Aerial Cake', 180.00, 25.00, 225.00, 450.00, 337.50, 40, 5),
(11, 1, 11, 'Sony 30 Shots Golden Willow Sky', 420.00, 25.00, 525.00, 1050.00, 787.50, 25, 5),
(12, 1, 12, 'Standard Hydro Bomb Sound Blast', 80.00, 25.00, 100.00, 200.00, 150.00, 110, 20);

-- 6.6 CUSTOMERS (Demo customers across all 3 tiers)
INSERT INTO customers (id, shop_id, full_name, mobile_number, address, referred_by, tier, total_purchases_count, total_spent) VALUES
(1, 1, 'Mahesh Kulkarni', '9822112233', 'Kothrud, Pune', 'Walk-in', 'NORMAL', 1, 1800.00),
(2, 1, 'Dr. Amit Deshmukh', '9822445566', 'Model Colony, Pune', 'Dr. Joshi', 'REGULAR', 5, 12500.00),
(3, 1, 'Vikram Patil (Cousin)', '9822778899', 'Prabhat Road, Pune', 'Family / Owner', 'CLOSE', 8, 24000.00),
(4, 1, 'Sneha Bhosale', '9822001122', 'Aundh, Pune', 'Instagram Ads', 'NORMAL', 2, 3200.00);

-- 6.7 SAMPLE BILL & BILL ITEMS (For analytics & testing)
INSERT INTO bills (id, bill_number, shop_id, customer_id, customer_name, customer_mobile, customer_tier, payment_method, overall_discount_percentage, subtotal_mrp, total_discount_amount, total_savings_amount, final_amount, total_purchase_cost, total_overhead_cost, profit_amount, profit_margin_percentage, margin_alert_level, festive_greeting, created_by_user_id, created_at) VALUES
(1, 'MFM-PUN-2026-0001', 1, 2, 'Dr. Amit Deshmukh', '9822445566', 'REGULAR', 'UPI', 15.00, 1750.00, 262.50, 262.50, 1487.50, 680.00, 850.00, 637.50, 75.00, 'GREEN', 'Happy Diwali! Thank you for celebrating with Fataka Mart!', 2, CURRENT_TIMESTAMP - INTERVAL '2 hours');

INSERT INTO bill_items (id, bill_id, shop_inventory_id, product_name, company_name, pack_description, purchase_price, overhead_price, selling_price, discount_percentage, final_rate, quantity, line_total, overhead_total) VALUES
(1, 1, 6, 'Standard Anar / Flower Pot Big', 'Standard Fireworks', 'Box of 10 Pcs', 100.00, 125.00, 250.00, 15.00, 212.50, 2, 425.00, 250.00),
(2, 1, 4, 'Standard Ground Chakra Special', 'Standard Fireworks', 'Box of 10 Pcs', 60.00, 75.00, 150.00, 15.00, 127.50, 2, 255.00, 150.00),
(3, 1, 10, 'Standard 12 Shots Aerial Cake', 'Standard Fireworks', '1 Box Cake', 180.00, 225.00, 450.00, 15.00, 382.50, 1, 382.50, 225.00),
(4, 1, 8, 'Coronation 1000 Wala Red Mala', 'Coronation Fireworks', '1 Roll Pack', 120.00, 150.00, 300.00, 15.00, 255.00, 1, 255.00, 150.00),
(5, 1, 1, 'Electric Sparklers 10cm', 'Standard Fireworks', 'Box of 10 Pcs', 25.00, 31.25, 60.00, 15.00, 51.00, 3, 153.00, 93.75);

-- Update Sequence Counters
SELECT setval('shops_id_seq', (SELECT MAX(id) FROM shops));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('base_products_id_seq', (SELECT MAX(id) FROM base_products));
SELECT setval('shop_inventories_id_seq', (SELECT MAX(id) FROM shop_inventories));
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));
SELECT setval('bills_id_seq', (SELECT MAX(id) FROM bills));
SELECT setval('bill_items_id_seq', (SELECT MAX(id) FROM bill_items));
