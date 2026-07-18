class BalanceTransaction {
  constructor(id, userId, type, amount, referenceId) {
    this.id = id;
    this.userId = userId;
    this.type = type; // advance | final_adjustment | withdrawal | payout_reversal
    this.amount = amount;
    this.referenceId = referenceId;
    this.createdAt = new Date();
  }
}

module.exports = BalanceTransaction;