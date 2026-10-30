# 🎇 Fataka Mart - Enterprise Multi-Branch Festival E-Commerce & Speed POS System

A modern, production-ready, full-stack application built for high-throughput Diwali firecracker retail operations. Features a multi-branch architecture, confidential margin protection engine, 3-tier customer pricing, speed billing POS, thermal receipt generation, automated WhatsApp invoice dispatch, and live sales/profit analytics.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Backend** | Java 21 LTS / Spring Boot 3.3.4 | Spring Data JPA, Spring Security (JWT), Lombok, MapStruct |
| **Frontend** | Angular 21 (Signals Architecture) | Standalone Components, Reactive Signals & Computed properties, Tailwind CSS, Lucide Icons, `html2canvas` |
| **Database** | PostgreSQL / H2 Fallback | Full relational schema with indexes, UUID extensions, and comprehensive Diwali seed catalog |
| **API Docs** | SpringDoc OpenAPI / Swagger 3 | Fully interactive API playground at `/api/swagger-ui/index.html` |

---

## 🌟 Key Architecture & Business Features

### 1. Multi-Branch & Sibling Shop Hierarchy
- **Super Admin (`npratikjagtap2704@gmail.com`)**: Controls global master catalog, registers branches, reviews cross-shop comparison metrics, and manages system accounts.
- **Shop Owners**: Assigned to a specific branch (e.g., *Main Mega Store*, *Station Branch*, *Highway Hub*). Can manage shop-specific overhead percentages, inventory, customer loyalty tiers, and view shop-level net profit analytics.

### 2. Confidential Margin & Pricing Engine
- **Strict Confidentiality**: `purchasePrice` and `overheadPrice` are strictly filtered out of all public and customer-facing APIs and thermal invoices.
- **Overhead Calculation**:
  $$\text{Overhead Price} = \text{Purchase Price} + \left(\text{Purchase Price} \times \frac{\text{Overhead \%}}{100}\right)$$
- **Strict 50% Profit Floor**:
  $$\text{Floor Price} = \text{Overhead Price} \times 1.50$$
- **Dynamic POS Margin Alerts**:
  - 🔴 **RED ALERT**: If line final rate or net total drops below 150% of overhead cost ($<50\%$ profit).
  - 🟠 **ORANGE ALERT**: If line final rate drops below 180% of overhead cost ($<80\%$ markup).
  - 🟢 **NORMAL**: Safe healthy profit margin.
- **Privacy "Eye" Toggle**: Located in the Speed POS header. Hides the overhead cost column with 1 click when customers are leaning over the billing counter.

### 3. 3-Tier Customer Pricing Engine
- **Tier 1 (Normal / Walk-in)**: Standard store MRP with shop-wide discount slider.
- **Tier 2 (Regular Customer)**: Automated suggestion targeting 85% markup on overhead cost.
- **Tier 3 (Close Friends & Family)**: Special VIP rate fixed at a modest 55% margin above overhead cost.
- **Inline Customer Creation**: Register new walk-in customers directly inside the POS without ever losing billing state.

### 4. Thermal Bill & WhatsApp Invoice Sharing
- **Thermal Invoice Layout**: Formatted like a 58mm/80mm thermal cash register slip with shop header, GST, sequential bill number (`MFM-{BRANCH}-{YEAR}-{SEQ}`), savings summary, and festive Diwali greeting.
- **1-Click JPG Export**: Rendered directly in the browser via `html2canvas` for printing or saving.
- **WhatsApp Web API**: Generates pre-formatted WhatsApp URLs (`https://wa.me/{mobile}?text=...`) containing customer name, bill number, savings breakdown, and net payable.

---

## 🚀 Live Local Execution

The project is already compiled and running live locally:

- **Frontend Application:** [http://localhost:4200](http://localhost:4200)
- **Backend API Base:** [http://localhost:8080/api](http://localhost:8080/api)
- **Interactive Swagger Docs:** [http://localhost:8080/api/swagger-ui/index.html](http://localhost:8080/api/swagger-ui/index.html)

### Pre-Configured Test Credentials

| Role | Email / Username | Password | Assigned Branch / Privileges |
|---|---|---|---|
| **Super Admin** | `npratikjagtap2704@gmail.com` | `Admin@123` | Global master dashboard, cross-shop comparison, catalog management |
| **Shop Owner** | `owner1@fatakamart.com` | `Owner@123` | *Fataka Mart - Main Mega Store* (Speed POS, shop profit dashboard, inventory) |
| **Customer** | `customer@fatakamart.com` | `Customer@123` | Storefront browsing, cart checkout, order history |

### Seeded Customers for POS Quick-Search
Type any of these in the Speed POS customer search box:
- `9822445566` / `Dr. Amit Deshmukh` (Tier 2: REGULAR)
- `9822099999` / `Vikram Patil (Cousin)` (Tier 3: CLOSE Friends & Family)
- `9822112233` / `Mahesh Kulkarni` (Tier 1: NORMAL)

---

## 💻 Manual Startup Instructions

### Backend (Spring Boot 3)
```powershell
cd fataka-mart-backend

# Build executable Fat JAR
mvn clean package -DskipTests

# Run with zero-setup H2 in-memory DB:
java -jar target/fataka-mart-backend-1.0.0-SNAPSHOT.jar --spring.profiles.active=h2

# Or run with local PostgreSQL (default profile):
# Make sure postgresql is running and credentials match application.yml
java -jar target/fataka-mart-backend-1.0.0-SNAPSHOT.jar
```

### Frontend (Angular 21)
```powershell
cd fataka-mart-frontend

# Install dependencies
npm install

# Start development server with proxy to backend
npm start
```

---

## 🌐 Production Cloud Deployment Guide

### 1. Database (Supabase / Neon / Render PostgreSQL)
1. Create a PostgreSQL 15+ database instance.
2. Run the DDL script: [database/schema.sql](file:///c:/Users/Admin/Desktop/Milind%20Fataka%20Mart/database/schema.sql).
3. The script creates all tables, indexes, constraints, and seeds the initial catalog.

### 2. Backend (Render.com / Railway.app)
1. Set the following environment variables in your hosting dashboard:
   - `SPRING_PROFILES_ACTIVE`: `prod` (or default)
   - `SPRING_DATASOURCE_URL`: `jdbc:postgresql://<your-db-host>:5432/<db_name>`
   - `SPRING_DATASOURCE_USERNAME`: `<db-user>`
   - `SPRING_DATASOURCE_PASSWORD`: `<db-password>`
   - `APP_JWT_SECRET`: `<64-character-secure-random-key>`
   - `APP_CORS_ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
2. Deploy directly from GitHub repository.

### 3. Frontend (Vercel / Netlify)
1. Set environment build command:
   ```bash
   npm run build
   ```
2. Output Directory:
   ```bash
   dist/fataka-mart-frontend/browser
   ```
3. Set your production API URL in `environment.prod.ts` or configure rewrite rules for `/api/*` to forward to your Render/Railway backend.

---

## 📜 License
Developed for **Fataka Mart Multi-Branch Retail Operations**. All rights reserved.
