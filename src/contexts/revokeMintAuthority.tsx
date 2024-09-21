import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, MintLayout, createSetAuthorityInstruction, AuthorityType} from '@solana/spl-token';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair, TransactionInstruction } from '@solana/web3.js';
import { WalletContextState } from "@solana/wallet-adapter-react";


export async function revokeMintAuthority(
    connection : Connection,
    wallet : WalletContextState,
    mintAddress : PublicKey,
) {
    if(wallet.publicKey != null) {
        const transaction = new Transaction();
        transaction.add(await createSetAuthorityInstruction(mintAddress, wallet.publicKey, 0, null,  [], TOKEN_PROGRAM_ID));

        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.feePayer = wallet.publicKey;
        if(wallet.signTransaction != undefined) {
            try {
                let signTX = await wallet.signTransaction(transaction);
                const signature = await connection.sendRawTransaction(signTX.serialize());
                console.log("signature ====>", signature);
            } catch(err) {
                console.log("revoking error ====>", err);
            }
        }
    }
}