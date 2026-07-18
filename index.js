const { v4: uuidv4 } = require("uuid");
const db = require("./db");
const User = require("./models/User");
const Brand = require("./models/Brand");
const Sale = require("./models/Sale");
const PayoutService = require("./services/PayoutService");

const payoutService = new PayoutService(db);

// ---- Seed data ----
const user = new User(uuidv4(), "john_doe");
db.users.push(user);

const brand1 = new Brand(uuidv4(), "brand_1");
db.brands.push(brand1);

const sale1 = new Sale(uuidv4(), user.id, brand1.id, 40);
const sale2 = new Sale(uuidv4(), user.id, brand1.id, 40);
const sale3 = new Sale(uuidv4(), user.id, brand1.id, 40);
db.sales.push(sale1, sale2, sale3);

console.log("---- BEFORE ANYTHING ----");
console.log("User balance:", user.withdrawableBalance);

// ---- Run advance payout job ----
const advanceResults = payoutService.runAdvancePayoutJob();
console.log("\n---- ADVANCE PAYOUT RESULTS ----");
console.log(advanceResults);
console.log("User balance after advance:", user.withdrawableBalance);

// ---- Run advance payout job AGAIN to test idempotency ----
const advanceResults2 = payoutService.runAdvancePayoutJob();
console.log("\n---- ADVANCE PAYOUT JOB RUN AGAIN (should be empty) ----");
console.log(advanceResults2);

// ---- Reconcile sales ----
console.log("\n---- RECONCILIATION ----");
console.log(payoutService.reconcileSale(sale1.id, "rejected"));
console.log(payoutService.reconcileSale(sale2.id, "approved"));
console.log(payoutService.reconcileSale(sale3.id, "approved"));

console.log("Final user balance:", user.withdrawableBalance);
// Expected: -4 + 36 + 36 = 68

// ---- Withdraw ----
console.log("\n---- WITHDRAWAL ----");
const payout = payoutService.withdraw(user.id, 68);
console.log(payout);
console.log("Balance after withdrawal:", user.withdrawableBalance);

// ---- Try withdrawing again immediately (should fail — 24hr rule) ----
console.log("\n---- WITHDRAW AGAIN IMMEDIATELY (should throw error) ----");
try {
  payoutService.withdraw(user.id, 10);
} catch (err) {
  console.log("Error:", err.message);
}

// ---- Simulate payout failure/recovery ----
console.log("\n---- PAYOUT FAILS, MONEY RECOVERED ----");
payoutService.handlePayoutFailure(payout.id, "failed");
console.log("Balance after recovery:", user.withdrawableBalance);