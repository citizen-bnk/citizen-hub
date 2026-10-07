import { test } from "node:test";
import assert from "node:assert/strict";
import { bankSchema, emptyBank, shareClassChanges, shareClassErrors, soldPercent, toForm, walletAddressError, walletTypesLeft } from "./logic";
import type { ShareClass } from "./api";

const cls: ShareClass = {
  id: 2, class_name: "Class B", display_name: "Class B", description: "Public offer", price_per_share: 10, currency: "LSL", min_shares: 100,
  max_shares: 100000, shares_on_offer: 5_000_000, shares_issued: 1_250_000, available_shares: 3_750_000, is_default: true, is_active: true, created_at: "", updated_at: "",
};

test("an untouched share class form is valid and has no changes", () => {
  assert.deepEqual(shareClassErrors(toForm(cls), cls.shares_issued), {});
  assert.deepEqual(shareClassChanges(cls, toForm(cls)), {});
});

test("share class changes list only what differs", () => {
  assert.deepEqual(shareClassChanges(cls, { ...toForm(cls), price_per_share: "12.50", description: "New text" }), { price_per_share: 12.5, description: "New text" });
});

test("share class validation", () => {
  const base = toForm(cls);
  assert.ok(shareClassErrors({ ...base, price_per_share: "0" }, 0).price_per_share);
  assert.ok(shareClassErrors({ ...base, price_per_share: "abc" }, 0).price_per_share);
  assert.ok(shareClassErrors({ ...base, price_per_share: "10.123" }, 0).price_per_share);
  assert.ok(shareClassErrors({ ...base, min_shares: "0" }, 0).min_shares);
  assert.ok(shareClassErrors({ ...base, max_shares: "50" }, 0).max_shares);
  assert.ok(shareClassErrors({ ...base, shares_on_offer: "1000" }, 1_250_000).shares_on_offer);
  assert.ok(shareClassErrors({ ...base, shares_on_offer: "-3" }, 0).shares_on_offer);
});

test("sold percent", () => {
  assert.equal(soldPercent(cls), 25);
  assert.equal(soldPercent({ shares_on_offer: 0, shares_issued: 0 }), 0);
  assert.equal(soldPercent({ shares_on_offer: 10, shares_issued: 20 }), 100);
});

test("wallet addresses are checked per coin", () => {
  assert.equal(walletAddressError("BTC", "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"), undefined);
  assert.equal(walletAddressError("BTC", "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"), undefined);
  assert.ok(walletAddressError("BTC", "0x52908400098527886E0F7030069857D2E4169EE7"));
  assert.equal(walletAddressError("ETH", "0x52908400098527886E0F7030069857D2E4169EE7"), undefined);
  assert.ok(walletAddressError("ETH", "0x1234"));
  assert.equal(walletAddressError("USDT", "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE"), undefined);
  assert.equal(walletAddressError("USDT", "0x52908400098527886E0F7030069857D2E4169EE7"), undefined);
  assert.ok(walletAddressError("USDT", ""));
  assert.ok(walletAddressError("DOGE", "x"));
  assert.deepEqual(walletTypesLeft(["BTC"]), ["ETH", "USDT"]);
});

test("bank account validation", () => {
  const ok = { ...emptyBank, account_name: "Citizen Bank", bank_name: "Standard Lesotho Bank", account_number: "9080012345", branch_code: "060667" };
  assert.equal(bankSchema.safeParse(ok).success, true);
  assert.equal(bankSchema.safeParse({ ...ok, swift_code: "SBICLSMX" }).success, true);
  assert.equal(bankSchema.safeParse({ ...ok, swift_code: "ABC" }).success, false);
  assert.equal(bankSchema.safeParse({ ...ok, currency: "RAND" }).success, false);
  assert.equal(bankSchema.safeParse({ ...ok, account_number: "12" }).success, false);
});
