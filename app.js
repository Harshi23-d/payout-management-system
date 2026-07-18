const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");
const User = require("./models/User");
const Brand = require("./models/Brand");
const Sale = require("./models/Sale");
const PayoutService = require("./services/PayoutService");

const app = express();
app.use(express.json());

const payoutService = new PayoutService(db);

// ---- Seed one user + brand for convenience ----
const user = new User(uuidv4(), "john_doe");
db.users.push(user);
const brand1 = new Brand(uuidv4(), "brand_1");
db.brands.push(brand1);
console.log("Seeded userId:", user.id);
console.log("Seeded brandId:", brand1.id);

// ---- CREATE A SALE ----
app.post("/sales", (req, res) => {
  try {
    const { userId, brandId, earning } = req.body;
    const sale = new Sale(uuidv4(), userId, brandId, earning);
    db.sales.push(sale);
    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---- GET ALL SALES ----
app.get("/sales", (req, res) => {
  res.json(db.sales);
});

// ---- RUN ADVANCE PAYOUT JOB ----
app.post("/advance-payout/run", (req, res) => {
  try {
    const results = payoutService.runAdvancePayoutJob();
    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---- RECONCILE A SALE ----
app.post("/sales/:id/reconcile", (req, res) => {
  try {
    const { status } = req.body; // "approved" or "rejected"
    const result = payoutService.reconcileSale(req.params.id, status);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---- WITHDRAW ----
app.post("/users/:id/withdraw", (req, res) => {
  try {
    const { amount } = req.body;
    const payout = payoutService.withdraw(req.params.id, amount);
    res.json(payout);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---- MARK A PAYOUT AS FAILED/CANCELLED/REJECTED (triggers recovery) ----
app.post("/payouts/:id/fail", (req, res) => {
  try {
    const { status } = req.body; // "cancelled" | "rejected" | "failed"
    const payout = payoutService.handlePayoutFailure(req.params.id, status);
    res.json(payout);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---- GET USER BALANCE ----
app.get("/users/:id/balance", (req, res) => {
  const foundUser = db.users.find((u) => u.id === req.params.id);
  if (!foundUser) return res.status(404).json({ error: "User not found" });
  res.json({ userId: foundUser.id, withdrawableBalance: foundUser.withdrawableBalance });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));