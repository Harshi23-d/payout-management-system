class Payout {
  constructor(id, userId, amount) {
    this.id = id;
    this.userId = userId;
    this.amount = amount;
    this.status = "initiated"; // initiated | completed | cancelled | rejected | failed
    this.createdAt = new Date();
  }
}

module.exports = Payout;