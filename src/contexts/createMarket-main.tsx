import { MAINNET_PROGRAM_ID, DEVNET_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getMint,
  TOKEN_PROGRAM_ID,
  ACCOUNT_SIZE,
  createInitializeAccountInstruction,
} from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import * as BN from 'bn.js';
import { DexInstructions, Market } from "@openbook-dex/openbook";
// import { LP_wallet_keypair, connection } from "../../config/config";
import {
  calculateTotalAccountSize,
  EVENT_QUEUE_HEADER_SIZE,
  EVENT_SIZE,
  REQUEST_QUEUE_HEADER_SIZE,
  REQUEST_SIZE,
  ORDERBOOK_HEADER_SIZE,
  ORDERBOOK_NODE_SIZE,
} from "@/config";
// import { sendBundle } from "./jitoBundle/sendBundle";

const SOL_TOKEN_ADDR = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

const LOT_SIZE = -3;
const TICK_SIZE = 8;
const lengthList = [
  { event: 128, request: 10, order: 201 },
  { event: 1400, request: 63, order: 450 },
  { event: 2978, request: 63, order: 909 }
];




export async function getVaultOwnerAndNonce(
  marketAddress: PublicKey,
  dexAddress: PublicKey
): Promise<[vaultOwner: PublicKey, nonce: BN]> {
  while (true) {
    const nonce = new BN.BN(0);
    // eslint-disable-next-line no-constant-condition
    try {
      const vaultOwner = await PublicKey.createProgramAddress(
        [marketAddress.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)],
        dexAddress
      );
      return [vaultOwner, nonce];
    } catch (e) {
      nonce.iaddn(1);
    }
  }
}

export const createMarket = async (
  connection : Connection,
  wallet: WalletContextState,
  baseMintAddress: PublicKey,
  marketPrice : number
) => {
  console.log(lengthList[marketPrice-1].event, lengthList[marketPrice-1].request, lengthList[marketPrice-1].order);


  const TOTAL_EVENT_QUEUE_SIZE = calculateTotalAccountSize(
    lengthList[marketPrice-1].event,
    // 128,
    EVENT_QUEUE_HEADER_SIZE,
    EVENT_SIZE
  );
  
  const TOTAL_REQUEST_QUEUE_SIZE = calculateTotalAccountSize(
    lengthList[marketPrice-1].request,
    // 10,
    REQUEST_QUEUE_HEADER_SIZE,
    REQUEST_SIZE
  );
  
  const TOTAL_ORDER_BOOK_SIZE = calculateTotalAccountSize(
    lengthList[marketPrice-1].order,
    // 201,
    ORDERBOOK_HEADER_SIZE,
    ORDERBOOK_NODE_SIZE
  );


  console.log("start ====>")
  let baseMint: PublicKey;
  let baseMintDecimals: number;
  let quoteMint: PublicKey;
  let quoteMintDecimals: number;
  const vaultInstructions: TransactionInstruction[] = [];
  const marketInstructions: TransactionInstruction[] = [];

  if(wallet.publicKey == null)  return null;

  try {
    const baseMintInfo = await getMint(connection, baseMintAddress);
    baseMint = baseMintInfo.address;
    baseMintDecimals = baseMintInfo.decimals;

    const quoteMintInfo = await getMint(connection, SOL_TOKEN_ADDR);
    quoteMint = quoteMintInfo.address;
    quoteMintDecimals = quoteMintInfo.decimals;
  } catch (e) {
    console.error("Invalid mints provided.", e);
    return null;
  }
  console.log("marketAccounts ===>")
  const marketAccounts = {
    market: Keypair.generate(),
    requestQueue: Keypair.generate(),
    eventQueue: Keypair.generate(),
    bids: Keypair.generate(),
    asks: Keypair.generate(),
    baseVault: Keypair.generate(),
    quoteVault: Keypair.generate(),
  };

  const [vaultOwner, vaultOwnerNonce] = await getVaultOwnerAndNonce(
    marketAccounts.market.publicKey,
    MAINNET_PROGRAM_ID.OPENBOOK_MARKET
  );

  console.log("vaultInstructions ===>")
  // create vaults
  vaultInstructions.push(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: marketAccounts.baseVault.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        ACCOUNT_SIZE
      ),
      space: ACCOUNT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }),
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: marketAccounts.quoteVault.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        ACCOUNT_SIZE
      ),
      space: ACCOUNT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeAccountInstruction(
      marketAccounts.baseVault.publicKey,
      baseMint,
      vaultOwner
    ),
    createInitializeAccountInstruction(
      marketAccounts.quoteVault.publicKey,
      quoteMint,
      vaultOwner
    )
  );

  // tickSize and lotSize here are the 1e^(-x) values, so no check for ><= 0
  const baseLotSize = Math.round(
    10 ** baseMintDecimals * Math.pow(10, -1 * LOT_SIZE)
  );
  const quoteLotSize = Math.round(
    10 ** quoteMintDecimals *
      Math.pow(10, -1 * LOT_SIZE) *
      Math.pow(10, -1 * TICK_SIZE)
  );

  console.log("marketInstructions ===>");
  // create market account
  marketInstructions.push(
    SystemProgram.createAccount({
      newAccountPubkey: marketAccounts.market.publicKey,
      fromPubkey: wallet.publicKey,
      space: Market.getLayout(MAINNET_PROGRAM_ID.OPENBOOK_MARKET).span,
      lamports: await connection.getMinimumBalanceForRentExemption(
        Market.getLayout(MAINNET_PROGRAM_ID.OPENBOOK_MARKET).span
      ),
      programId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
    })
  );

  // create request queue
  marketInstructions.push(
    SystemProgram.createAccount({
      newAccountPubkey: marketAccounts.requestQueue.publicKey,
      fromPubkey: wallet.publicKey,
      space: TOTAL_REQUEST_QUEUE_SIZE,
      lamports: await connection.getMinimumBalanceForRentExemption(
        TOTAL_REQUEST_QUEUE_SIZE
      ),
      programId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
    })
  );

  // create event queue
  marketInstructions.push(
    SystemProgram.createAccount({
      newAccountPubkey: marketAccounts.eventQueue.publicKey,
      fromPubkey: wallet.publicKey,
      space: TOTAL_EVENT_QUEUE_SIZE,
      lamports: await connection.getMinimumBalanceForRentExemption(
        TOTAL_EVENT_QUEUE_SIZE
      ),
      programId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
    })
  );

  const orderBookRentExempt =
    await connection.getMinimumBalanceForRentExemption(TOTAL_ORDER_BOOK_SIZE);

  // create bids
  marketInstructions.push(
    SystemProgram.createAccount({
      newAccountPubkey: marketAccounts.bids.publicKey,
      fromPubkey: wallet.publicKey,
      space: TOTAL_ORDER_BOOK_SIZE,
      lamports: orderBookRentExempt,
      programId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
    })
  );

  // create asks
  marketInstructions.push(
    SystemProgram.createAccount({
      newAccountPubkey: marketAccounts.asks.publicKey,
      fromPubkey: wallet.publicKey,
      space: TOTAL_ORDER_BOOK_SIZE,
      lamports: orderBookRentExempt,
      programId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
    })
  );

  marketInstructions.push(
    DexInstructions.initializeMarket({
      market: marketAccounts.market.publicKey,
      requestQueue: marketAccounts.requestQueue.publicKey,
      eventQueue: marketAccounts.eventQueue.publicKey,
      bids: marketAccounts.bids.publicKey,
      asks: marketAccounts.asks.publicKey,
      baseVault: marketAccounts.baseVault.publicKey,
      quoteVault: marketAccounts.quoteVault.publicKey,
      baseMint,
      quoteMint,
      baseLotSize: new BN.BN(baseLotSize),
      quoteLotSize: new BN.BN(quoteLotSize),
      feeRateBps: 150, // Unused in v3
      quoteDustThreshold: new BN.BN(500), // Unused in v3
      vaultSignerNonce: vaultOwnerNonce,
      programId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
    })
  );
  console.log("Trnasactions for market creation is ready, sending transactions")

  try {
    let blockhash = (await connection.getLatestBlockhash("finalized"))
      .blockhash;
    // const totalTransaction = new Transaction().add(...vaultInstructions, ...marketInstructions);
    // totalTransaction.recentBlockhash = blockhash;
    // totalTransaction.feePayer = wallet.publicKey;
    // totalTransaction.sign(
    //   marketAccounts.baseVault,
    //   marketAccounts.quoteVault,
    //   marketAccounts.market,
    //   marketAccounts.requestQueue,
    //   marketAccounts.eventQueue,
    //   marketAccounts.bids,
    //   marketAccounts.asks
    // );

    // const tx = await wallet.sendTransaction(totalTransaction, connection);

    // console.log("tx ====>", tx);

    // const transactionConfirmed = await connection.confirmTransaction(tx, 'confirmed');
    // if(transactionConfirmed)  return marketAccounts.market.publicKey;
    // return null;

    const createVaultTransaction = new Transaction().add(...vaultInstructions);
    createVaultTransaction.recentBlockhash = blockhash;
    createVaultTransaction.feePayer = wallet.publicKey;
    createVaultTransaction.sign(
      marketAccounts.baseVault,
      marketAccounts.quoteVault
    );

    const createMarketTransaction = new Transaction().add(
      ...marketInstructions
    );
    createMarketTransaction.recentBlockhash = blockhash;
    createMarketTransaction.feePayer = wallet.publicKey;
    createMarketTransaction.sign(
      marketAccounts.market,
      marketAccounts.requestQueue,
      marketAccounts.eventQueue,
      marketAccounts.bids,
      marketAccounts.asks
    );

    const tx = await wallet.sendTransaction(createVaultTransaction, connection);

    console.log("Vault tx ====>", tx);

    const transactionConfirmed = await connection.confirmTransaction(tx, 'confirmed');
    if(transactionConfirmed) {
        const tx1 = await wallet.sendTransaction(createMarketTransaction, connection);

      console.log("Market tx ====>", tx1);

      const transactionConfirmed = await connection.confirmTransaction(tx1, 'confirmed');
      if(transactionConfirmed)  return marketAccounts.market.publicKey;
      return null;
    };
    return null;


    // let success = await sendBundle([
    //   createVaultTransaction,
    //   createMarketTransaction,
    // ]);

    // if (success) {
    //   console.log("Market ID: ", marketAccounts.market.publicKey.toBase58());
    //   return marketAccounts.market.publicKey;
    // }
  } catch (e) {
    console.error("Error creating market: ", e);
  }
};
