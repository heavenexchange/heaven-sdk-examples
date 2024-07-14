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

console.log("Adding 10,000 base tokens and quote tokens to the pool...");
const amount = new BN(10000 * 10 ** pool.baseTokenMintDecimals);
const addLpQuote = await pool.quoteAddLp({
 amount: amount,
 inputSide: "base",
 slippage: new BN(100), // 1%
});

console.log("Quote ", addLpQuote);

const addLpIx = await pool.addLpIx({
 quoteResult: addLpQuote,
});

const addLpTx = await sendAndConfirmTransaction(
 connection,
 new Transaction().add(addLpIx),
 [payer],
 {
  commitment: "confirmed",
 }
);

console.log("Add LP transaction confirmed!", addLpTx);
