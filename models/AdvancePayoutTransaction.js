class AdvancePayoutTransaction {
  constructor(id, saleId, amount) {
    this.id = id;
    this.saleId = saleId;
    this.amount = amount;
    this.createdAt = new Date();
  }
}

module.exports = AdvancePayoutTransaction;