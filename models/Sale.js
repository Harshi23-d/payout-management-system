class Sale {
  constructor(id, userId, brandId, earning) {
    this.id = id;
    this.userId = userId;
    this.brandId = brandId;
    this.earning = earning;
    this.status = "pending"; // pending | approved | rejected
    this.advancePaid = 0;
    this.advancePaidAt = null;
    this.reconciledAt = null;
  }
}

module.exports = Sale;