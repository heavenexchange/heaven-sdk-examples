import { Heaven } from "heaven-sdk";
import { createPool } from "./common.mjs";
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

console.log("Claim all locked LP tokens...");
const amount = await pool.lockedLpTokenBalance;
const ix = await pool.claimLpTokensIx({
 amount,
});

const tx = await sendAndConfirmTransaction(
 connection,
 new Transaction().add(ix),
 [payer],
 {
  commitment: "confirmed",
 }
);

console.log("Claim LP transaction confirmed!", tx);
