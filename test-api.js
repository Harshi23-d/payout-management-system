async function main() {
  const userId = "c58b6154-d707-4e71-be2b-3147f9b30c14";
  const brandId = "50fffd5d-06e4-44d5-a74e-c03c314c1103";
  const base = "http://localhost:3000";

  // 1. Create 3 sales
  const saleIds = [];
  for (let i = 0; i < 3; i++) {
    const res = await fetch(`${base}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, brandId, earning: 40 }),
    });
    const sale = await res.json();
    saleIds.push(sale.id);
    console.log("Created sale:", sale);
  }

  // 2. Run advance payout job
  const advanceRes = await fetch(`${base}/advance-payout/run`, { method: "POST" });
  console.log("\nAdvance payout results:", await advanceRes.json());

  // 3. Check balance
  let balRes = await fetch(`${base}/users/${userId}/balance`);
  console.log("\nBalance after advance:", await balRes.json());

  // 4. Reconcile: sale1 rejected, sale2 & sale3 approved
  console.log("\n-- Reconciling --");
  console.log(await (await fetch(`${base}/sales/${saleIds[0]}/reconcile`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "rejected" }),
  })).json());

  console.log(await (await fetch(`${base}/sales/${saleIds[1]}/reconcile`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "approved" }),
  })).json());

  console.log(await (await fetch(`${base}/sales/${saleIds[2]}/reconcile`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "approved" }),
  })).json());

  // 5. Check balance again
  balRes = await fetch(`${base}/users/${userId}/balance`);
  console.log("\nBalance after reconciliation:", await balRes.json());

  // 6. Withdraw
  const withdrawRes = await fetch(`${base}/users/${userId}/withdraw`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 80 }),
  });
  console.log("\nWithdrawal:", await withdrawRes.json());

  balRes = await fetch(`${base}/users/${userId}/balance`);
  console.log("\nFinal balance:", await balRes.json());
}

main();