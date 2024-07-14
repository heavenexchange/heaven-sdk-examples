import { Heaven } from "heaven-sdk";
import { createPool } from "./common.mjs";
import { BN } from "bn.js";
import { sendAndConfirmTransaction, Transaction } from "@solana/web3.js";

const { id, connection, payer, network } = await createPool("unlock");

const pool = await Heaven.load({
 id,
 connection,
 payer: payer.publicKey,
 network,
});

console.log("Waiting for the pool to open...");
await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

console.log("Remove all liquidity from the pool...");
const amount = await pool.lpTokens;
const removeLpQuote = await pool.quoteRemoveLp({
 amount: amount,
 slippage: new BN(100), // 1%
});

console.log("Quote ", removeLpQuote);

const removeLpIx = await pool.removeLpIx({
 quoteResult: removeLpQuote,
});

const removeLpTx = await sendAndConfirmTransaction(
 connection,
 new Transaction().add(removeLpIx),
 [payer],
 {
  commitment: "confirmed",
 }
);

console.log("Remove LP transaction confirmed!", removeLpTx);
