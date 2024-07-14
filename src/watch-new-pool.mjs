import { Heaven, HeavenSupportedNetwork } from "heaven-sdk";
import { createPool } from "./common.mjs";
import { BN } from "bn.js";
import {
 Connection,
 sendAndConfirmTransaction,
 Transaction,
} from "@solana/web3.js";

const connection = new Connection("http://localhost:8899", "confirmed");
const program = Heaven.createProgram(HeavenSupportedNetwork.localnet, connection);

const listenerId = program.addEventListener('CreateLiquidityPoolEvent', (event) => {
 console.log('CreateLiquidityPoolEvent', event);
});

const { id } = await createPool();

program.removeEventListener(listenerId);
