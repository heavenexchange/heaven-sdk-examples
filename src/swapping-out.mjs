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

console.log("Swapping out 10,000 tokens for as little SOL as possible...");
const swapOutAmount = new BN(10000 * 10 ** pool.baseTokenMintDecimals);
const swapOutQuote = await pool.quoteSwapOut({
 amount: swapOutAmount,
 inputSide: "quote",
 slippage: new BN(100), // 1%
});

console.log("Quote ", swapOutQuote);

const swapOutIx = await pool.swapOutIx({
 quoteResult: swapOutQuote,
 amount: swapOutAmount,
});

const swapOutTx = await sendAndConfirmTransaction(
 connection,
 new Transaction().add(swapOutIx),
 [payer],
 {
  commitment: "confirmed",
 }
);

console.log("Swap out transaction confirmed!", swapOutTx);
