class User {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.withdrawableBalance = 0;
    this.lastWithdrawalAt = null;
  }
}

module.exports = User;