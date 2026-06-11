# 🍕 Pizza Store Backend API

A complete RESTful backend for a Pizza Store application built using **Node.js**, **Express.js**, **MongoDB**, and **JWT Authentication**.

## Features

- User Registration & Login
- Role-based Authentication (Admin / Customer)
- Menu Management
- Order Management
- Revenue Analytics
- Automated Testing with Jest & Supertest

---

# 🚀 Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- Jest
- Supertest
- MongoDB Memory Server

---

# 📂 Project Structure

```text
pizza-store-backend/
│
├── controllers/
│   ├── authController.js
│   ├── menuController.js
│   ├── orderController.js
│   └── revenueController.js
│
├── middleware/
│   └── authMiddleware.js
│
├── models/
│   ├── User.js
│   ├── MenuItem.js
│   └── Order.js
│
├── routes/
│   ├── authRoutes.js
│   ├── menuRoutes.js
│   ├── orderRoutes.js
│   └── revenueRoutes.js
│
├── tests/
│   ├── auth.test.js
│   ├── menu.test.js
│   ├── orders.test.js
│   ├── revenue.test.js
│   ├── helpers.js
│   └── setup.js
│
├── app.js
├── server.js
├── seed.js
├── package.json
├── .env
└── README.md
```

---

# ⚙️ Installation

## 1. Clone Repository

```bash
git clone <repository-url>
cd pizza-store-backend
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create a `.env` file:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pizza-store
JWT_SECRET=your_jwt_secret_key
```

## 4. Seed Database

Populate the database with sample menu items and admin account:

```bash
npm run seed
```

## 5. Start Server

```bash
npm start
```

Server will run on:

```text
http://localhost:5000
```

---

# 🔑 Default Admin Credentials

```text
Email: admin@pizzastore.com
Password: admin123
```

---

# 🔒 Authentication

Protected routes require a JWT token.

Add the token in request headers:

```http
Authorization: Bearer <jwt_token>
```

---

# 👤 User Roles

## Customer

Can:

- Register
- Login
- View Menu
- Place Orders
- View Own Orders
- Cancel Pending Orders
- View Bills

## Admin

Can:

- Manage Menu
- View All Orders
- Update Order Status
- Access Revenue Analytics
- View Customer List

---

# 📌 API Endpoints

## Authentication

Base URL:

```text
/ api/auth
```

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | /register | Register new customer |
| POST | /login | Login user |
| GET | /profile | Get profile |
| PUT | /profile | Update profile |
| GET | /users | Get all customers (Admin) |

### Register Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "address": "Kolkata"
}
```

---

## Menu

Base URL:

```text
/api/menu
```

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | / | Get all menu items |
| GET | /?category=pizza | Filter by category |
| GET | /?search=margherita | Search by name |
| GET | /:id | Get menu item |
| POST | / | Create menu item (Admin) |
| PUT | /:id | Update menu item (Admin) |
| DELETE | /:id | Delete menu item (Admin) |

### Supported Categories

```text
pizza
sides
beverages
combo
new launches
bestsellers
```

---

## Orders

Base URL:

```text
/api/orders
```

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | / | Place Order |
| GET | / | Get Orders |
| GET | /:id | Get Single Order |
| PUT | /:id/cancel | Cancel Order |
| PUT | /:id/status | Update Status (Admin) |
| GET | /:id/bill | Generate Bill |

### Create Order Example

```json
{
  "items": [
    {
      "menuItem": "menu_item_id",
      "quantity": 2
    }
  ],
  "deliveryMode": "delivery",
  "deliveryAddress": "Sector 2",
  "paymentMode": "upi"
}
```

### Order Status Flow

```text
pending
  ↓
accepted
  ↓
delivered
```

Alternative paths:

```text
pending → cancelled
pending → rejected
```

---

## Revenue

Base URL:

```text
/ api/revenue
```

Admin Only Routes.

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | /summary | Overall revenue summary |
| GET | /monthly?year=2025 | Monthly revenue report |

### Revenue Summary Response

```json
{
  "totalRevenue": 25000,
  "totalOrders": 150,
  "pendingOrders": 5
}
```

---

# 🗄️ Database Models

## User

```javascript
{
  name,
  email,
  password,
  role,
  phone,
  address
}
```

### Roles

```text
customer
admin
```

## MenuItem

```javascript
{
  name,
  description,
  price,
  category,
  image,
  isAvailable,
  size
}
```

### Sizes

```text
small
medium
large
regular
N/A
```

## Order

```javascript
{
  customer,
  items,
  totalAmount,
  status,
  statusMessage,
  deliveryMode,
  deliveryAddress,
  paymentMode,
  isPaid
}
```

---

# 🧪 Running Tests

This project includes automated tests using:

- Jest
- Supertest
- MongoDB Memory Server

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Covered Modules

- Authentication
- Menu APIs
- Orders APIs
- Revenue APIs

---

# 📈 Features

## Authentication

- JWT Based Login
- Password Hashing using bcryptjs
- Role-based Authorization

## Menu Management

- CRUD Operations
- Category Filtering
- Search Support
- Availability Control

## Order System

- Place Orders
- Status Tracking
- Billing
- Cancellation Support

## Analytics

- Revenue Summary
- Monthly Revenue Reports
- Pending Order Tracking

---

# 🛠 Available Scripts

```bash
npm start
```

Starts production server.

```bash
npm run seed
```

Seeds database with sample data.

```bash
npm test
```

Runs test suite.

```bash
npm run test:watch
```

Runs tests in watch mode.

---

# 📄 License

This project is created for educational and learning purposes.
