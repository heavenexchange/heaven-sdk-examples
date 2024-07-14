import {
 ComputeBudgetProgram,
 Connection,
 Keypair,
 LAMPORTS_PER_SOL,
 PublicKey,
 SystemProgram,
 Transaction,
 sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "bn.js";
import { Heaven } from "heaven-sdk";
import {
 AuthorityType,
 createAssociatedTokenAccountInstruction,
 createInitializeMintInstruction,
 createMintToCheckedInstruction,
 createSetAuthorityInstruction,
 createSyncNativeInstruction,
 getAssociatedTokenAddressSync,
 getMinimumBalanceForRentExemptMint,
 MINT_SIZE,
 NATIVE_MINT,
 TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

async function createPool(lp = 'lock') {
 console.log("Creating a new liquidity pool...");
 const creator = Keypair.generate();
 const connection = new Connection(
  "http://localhost:8899" ?? "https://api.devnet.solana.com", // Replace with your preferred Solana RPC endpoint
  "confirmed"
 );

 const signature = await connection.requestAirdrop(
  creator.publicKey,
  3 * LAMPORTS_PER_SOL
 );
 await connection.confirmTransaction(signature);

 const mint = Keypair.generate();
 const decimals = 9;
 const amount = 1000_000_000 * 10 ** decimals; // Mint 1 Billion tokens

 const tokenAccount = getAssociatedTokenAddressSync(
  mint.publicKey,
  creator.publicKey,
  false,
  TOKEN_PROGRAM_ID
 );

 const tx = new Transaction().add(
  // Create mint account
  SystemProgram.createAccount({
   fromPubkey: creator.publicKey,
   newAccountPubkey: mint.publicKey,
   space: MINT_SIZE,
   lamports: await getMinimumBalanceForRentExemptMint(connection),
   programId: TOKEN_PROGRAM_ID,
  }),
  // Create a new token
  createInitializeMintInstruction(
   mint.publicKey, // mint pubkey
   decimals, // decimals
   creator.publicKey, // mint authority
   null // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
  ),
  // Create a new token account to receive the minted tokens
  createAssociatedTokenAccountInstruction(
   creator.publicKey, // payer
   tokenAccount, // ata
   creator.publicKey, // owner
   mint.publicKey // mint
  ),
  // Mint tokens to the token account
  createMintToCheckedInstruction(
   mint.publicKey, // mint
   tokenAccount, // receiver (should be a token account)
   creator.publicKey, // mint authority
   amount, // amount. if your decimals is 8, you mint 10^8 for 1 token.
   decimals // decimals
  ),
  // Optionally, revoke the mint authority
  createSetAuthorityInstruction(
   mint.publicKey, // mint acocunt || token account
   creator.publicKey, // current auth
   AuthorityType.MintTokens, // authority type
   null // new auth (you can pass `null` to close it)
  )
 );

 await sendAndConfirmTransaction(connection, tx, [creator, mint], {
  commitment: "confirmed",
 });

 const wsolTokenAccount = getAssociatedTokenAddressSync(
  NATIVE_MINT,
  creator.publicKey,
  false,
  TOKEN_PROGRAM_ID
 );

 console.log(
  "Creating a new token account for WSOL...",
  wsolTokenAccount.toBase58()
 );

 const tx2 = new Transaction().add(
  createAssociatedTokenAccountInstruction(
   creator.publicKey,
   wsolTokenAccount,
   creator.publicKey,
   NATIVE_MINT
  ),
  SystemProgram.transfer({
   fromPubkey: creator.publicKey,
   toPubkey: wsolTokenAccount,
   lamports: 2 * LAMPORTS_PER_SOL,
  }),
  createSyncNativeInstruction(wsolTokenAccount, TOKEN_PROGRAM_ID)
 );
 await sendAndConfirmTransaction(connection, tx2, [creator], {
  commitment: "confirmed",
 });
 console.log("WSOL token account created successfully!");

 // Initialize a new liquidity pool
 const pool = await Heaven.new({
  base: mint.publicKey, // The token we created;
  quote: NATIVE_MINT, // WSOL;
  connection: connection,
  payer: creator.publicKey,
  network: "localnet",
  // Optional: If you want to use a custom program ID
  // programId: new PublicKey('...'), // Insert the program ID
 });

 // This will create a new liquidity pool with the following parameters:
 // - 1 SOL
 // - 1000,000 of the token we created
 // - 1% sell tax -> Swapping from base to quote token
 // - 0.25% buy tax -> Swapping from quote to base token
 // - Lock liquidity for 60 seconds
 // - Open pool 5 seconds after creation
 // - And only allowing pool creator to add additional liquidity
 const ix = await pool.createIx({
  // amount of base token to deposit
  baseAmount: new BN(1000_000 * 10 ** pool.baseTokenMintDecimals),
  // amount of quote token to deposit
  quoteAmount: new BN(1 * 10 ** pool.quoteTokenMintDecimals),
  // sellTax BPS = 100 / 10000 * 100 = 1%;
  sellTax: new BN(100),
  // buyTax BPS = 25 / 10000 * 100 = 0.25%;
  buyTax: new BN(25),
  // locking liquidity
  lp, // or 'burn' to burn LP tokens
  // Lock liquidity for 5 seconds
  lockLiquidityUntil: lp === 'lock' ? new Date(new Date().getTime() + 5 * 1000) : null,
  // Open pool 5 seconds after creation
  openPoolAt: new Date(new Date().getTime() + 5 * 1000),
  // [OPTIONAL]: The contract will emit this event when the pool is created
  event: "",
  // [OPTIONAL]: Only allow pool creatot to add additional liquidity.
  // Default is `false`.
  // Important: This cannot be changed after pool creation.
  // Setting this to `true` will only allow the pool creator to collect swap fees without pulling
  // all the liquidity from the pool.
  disableNonCreatorAddLiquidity: true,
 });

 const id = pool.subscribeCustomEvent((event, poolId, instruction) => {
  console.log("Custom event:", event, poolId, instruction);
 });

 // Don't forget to unsubscribe from the custom event when you no longer need it
 await pool.unsubscribe(id);

 const createPoolTx = await sendAndConfirmTransaction(
  connection,
  new Transaction().add(
   // Creating a new pool uses more than the default 200K compute units
   // so we need to increase the compute unit limit
   // to avoid the transaction failing with an error
   ComputeBudgetProgram.setComputeUnitLimit({
    units: 300000,
   }),
   ix
  ),
  [creator],
  {
   commitment: "confirmed",
  }
 );
 console.log("Liquidity pool created successfully!", createPoolTx);
 console.log("Pool address:", pool.liquidityPoolState.toBase58());

 return {
  id: pool.liquidityPoolState,
  payer: creator,
  connection,
  network: "localnet",
 };
}

export { createPool };
