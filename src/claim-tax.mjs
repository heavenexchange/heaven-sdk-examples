import { Heaven } from "heaven-sdk";
import { createPool } from "./common.mjs";
import { BN } from "bn.js";
import { sendAndConfirmTransaction, Transaction } from "@solana/web3.js";

const { id, connection, payer, network } = await createPool();

const pool = await Heaven.load({
 id,
 connection,
 payer: payer.publicKey,
 network,
});

console.log("Waiting for the pool to open...");
await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

console.log("Swapping 1 SOL for as much tokens as possible...");
const swapInAmount = new BN(1 * 10 ** pool.quoteTokenMintDecimals);
const swapInQuote = await pool.quoteSwapIn({
 amount: swapInAmount,
 inputSide: "quote",
 slippage: new BN(100), // 1%
});

console.log("Quote ", swapInQuote);

const swapInIx = await pool.swapInIx({
 quoteResult: swapInQuote,
 amount: swapInAmount,
});

const swapInTx = await sendAndConfirmTransaction(
 connection,
 new Transaction().add(swapInIx),
 [payer],
 {
  commitment: "confirmed",
 }
);
console.log("Swap in transaction confirmed!", swapInTx);

const baseTaxBalance = await pool.baseTaxBalance;
const quoteTaxBalance = await pool.quoteTaxBalance;

console.log("Base tax balance:", baseTaxBalance.toString());
console.log("Quote tax balance:", quoteTaxBalance.toString());

console.log("Claiming tax...");

const claimTaxIx = await pool.claimTaxIx({
 base: baseTaxBalance,
 quote: quoteTaxBalance,
});

const claimTaxTx = await sendAndConfirmTransaction(
 connection,
 new Transaction().add(claimTaxIx),
 [payer],
 {
  commitment: "confirmed",
 }
);

console.log("Claim tax transaction confirmed!", claimTaxTx);
