const AdvancePayoutTransaction = require("../models/AdvancePayoutTransaction");
const BalanceTransaction = require("../models/BalanceTransaction");
const Payout = require("../models/Payout");
const { v4: uuidv4 } = require("uuid");

class PayoutService {
  constructor(db) {
    // db is a simple in-memory store object holding all arrays
    this.db = db;
  }

  // ---------- 1. ADVANCE PAYOUT ----------
  runAdvancePayoutJob() {
    const results = [];

    for (const sale of this.db.sales) {
      if (sale.status !== "pending") continue;

      const alreadyPaid = this.db.advanceTransactions.find(
        (t) => t.saleId === sale.id
      );
      if (alreadyPaid) continue; // idempotency guard — never pay twice

      const advanceAmount = +(sale.earning * 0.1).toFixed(2);

      const txn = new AdvancePayoutTransaction(uuidv4(), sale.id, advanceAmount);
      this.db.advanceTransactions.push(txn);

      sale.advancePaid = advanceAmount;
      sale.advancePaidAt = txn.createdAt;

      this._creditBalance(sale.userId, advanceAmount, "advance", sale.id);

      results.push({ saleId: sale.id, advancePaid: advanceAmount });
    }

    return results;
  }

  // ---------- 2. RECONCILIATION ----------
  reconcileSale(saleId, newStatus) {
    if (!["approved", "rejected"].includes(newStatus)) {
      throw new Error("Invalid status. Must be approved or rejected.");
    }

    const sale = this.db.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error("Sale not found");
    if (sale.status !== "pending") throw new Error("Sale already reconciled");

    sale.status = newStatus;
    sale.reconciledAt = new Date();

    let finalAdjustment;
    if (newStatus === "approved") {
      finalAdjustment = +(sale.earning - sale.advancePaid).toFixed(2);
    } else {
      finalAdjustment = -sale.advancePaid;
    }

    this._creditBalance(sale.userId, finalAdjustment, "final_adjustment", sale.id);

    return { saleId: sale.id, status: newStatus, finalAdjustment };
  }

  // ---------- 3. WITHDRAWAL ----------
  withdraw(userId, amount) {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");

    if (user.lastWithdrawalAt) {
      const hoursSinceLast =
        (Date.now() - new Date(user.lastWithdrawalAt).getTime()) / 36e5;
      if (hoursSinceLast < 24) {
        throw new Error("Withdrawal allowed only once every 24 hours");
      }
    }

    if (amount > user.withdrawableBalance) {
      throw new Error("Insufficient balance");
    }

    const payout = new Payout(uuidv4(), userId, amount);
    this.db.payouts.push(payout);

    user.withdrawableBalance = +(user.withdrawableBalance - amount).toFixed(2);
    user.lastWithdrawalAt = new Date();

    this._logTransaction(userId, "withdrawal", -amount, payout.id);

    return payout;
  }

  // ---------- 4. FAILED PAYOUT RECOVERY ----------
  handlePayoutFailure(payoutId, newStatus) {
    if (!["cancelled", "rejected", "failed"].includes(newStatus)) {
      throw new Error("Invalid failure status");
    }

    const payout = this.db.payouts.find((p) => p.id === payoutId);
    if (!payout) throw new Error("Payout not found");

    payout.status = newStatus;

    // credit the amount back to withdrawable balance
    this._creditBalance(payout.userId, payout.amount, "payout_reversal", payout.id);

    return payout;
  }

  // ---------- INTERNAL HELPERS ----------
  _creditBalance(userId, amount, type, referenceId) {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");

    user.withdrawableBalance = +(user.withdrawableBalance + amount).toFixed(2);
    this._logTransaction(userId, type, amount, referenceId);
  }

  _logTransaction(userId, type, amount, referenceId) {
    const txn = new BalanceTransaction(uuidv4(), userId, type, amount, referenceId);
    this.db.balanceTransactions.push(txn);
  }
}

module.exports = PayoutService;