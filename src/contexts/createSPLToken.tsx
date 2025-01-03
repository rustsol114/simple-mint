import { 
    TOKEN_PROGRAM_ID, 
    ASSOCIATED_TOKEN_PROGRAM_ID, 
    MintLayout, 
    getMinimumBalanceForRentExemptMint, 
    createInitializeMintInstruction,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction
    } from '@solana/spl-token';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair, TransactionInstruction, sendAndConfirmRawTransaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Dispatch, SetStateAction } from 'react';
import { PROGRAM_ID, DataV2, createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex, MetaplexFileTag, walletAdapterIdentity, bundlrStorage} from '@metaplex-foundation/js';

export async function createSPLToken(owner: PublicKey, wallet: WalletContextState, connection: Connection, quantity: number, decimals: number, isChecked: boolean, tokenName: string, symbol: string, metadataURL: string, description: string, file: Readonly<{
    buffer: Buffer;
    fileName: string;
    displayName: string;
    uniqueName: string;
    contentType: string | null;
    extension: string | null;
    tags: MetaplexFileTag[];
}> | undefined,
    metadataMethod: string) {
    try {
        console.log("creating spl token")
        // setIscreating(true)
        // setTokenAddresss('')
        if(wallet.publicKey) {
            console.log("getting balance ===>");
            const balance = await connection.getBalance(wallet.publicKey);
            console.log("balance ===>", balance);
        }

        const metaplex = Metaplex.make(connection, {cluster: 'mainnet-beta'})
            .use(walletAdapterIdentity(wallet))
            .use(bundlrStorage({
                // address : 'https://devnet.bundlr.network',
                address : 'https://node1.bundlr.network',
                // providerUrl: "https://devnet.helius-rpc.com/?api-key=934757b5-6bfc-49d7-a577-b40b81662855",
                providerUrl : "https://mainnet.helius-rpc.com/?api-key=934757b5-6bfc-49d7-a577-b40b81662855",
                // providerUrl : "https://solana-devnet.g.alchemy.com/v2/nPdtpY0LxgpMlnGOA94LoTCpEy-Nd2gG",
                timeout: 60000
            }));
            // {
            //     address: 'https://devnet.irys.xyz',
            //     providerUrl : 'https://solana-mainnet.g.alchemy.com/v2/nPdtpY0LxgpMlnGOA94LoTCpEy-Nd2gG',
            //     // providerUrl: "https://api.devnet.solana.com",
            //     // providerUrl: "https://cosmopolitan-greatest-wave.solana-mainnet.quiknode.pro/85222162e13661be38ab86fe26925e667496812d/",
            //     timeout: 60000,
            // }
        console.log("metaplex ===>", metaplex);
        const mint_rent = await getMinimumBalanceForRentExemptMint(connection);
        // Token.createSetAuthorityInstruction()

        const mint_account = Keypair.generate();

        let InitMint: TransactionInstruction

        const [metadataPDA] = await PublicKey.findProgramAddress(
            [
                Buffer.from("metadata"),
                PROGRAM_ID.toBuffer(),
                mint_account.publicKey.toBuffer(),
            ], PROGRAM_ID
        );

        let URI: string = ''
        console.log("start =====>");

        if (metadataMethod == 'url') {
            if (metadataURL != '') {
                URI = metadataURL
            }
            else {
                // setIscreating(false)
                // setError('Please provide a metadata URL!')
            }
        }

        else {
            if (file) {
                console.log("upload ===>");
                // let ImageUri;
                // try {
                //     ImageUri = await metaplex.storage().upload(file);
                // } catch(err) {
                //     console.log("upload error =====>", err);
                // }
                // console.log("imageuri ===>", ImageUri);
                try {
                    const { uri } = await metaplex.nfts().uploadMetadata({
                        name: tokenName,
                        symbol: symbol,
                        description: description,
                        image: file,
                    })
                    console.log("uri ===>", uri);
                    if (uri) {
                        URI = uri
                    }
                } catch(err) {
                    console.log("upload metadata ===>", err);
                }
            }
            else {
                // setIscreating(false)
                // setError('Please provide an image file!')
            }
        }

        if (URI != '') {

            const tokenMetadata: DataV2 = {
                name: tokenName,
                symbol: symbol,
                uri: URI,
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null
            };

            const args = {
                data: tokenMetadata,
                isMutable: true,
                collectionDetails: null
            };

            const createMintAccountInstruction = await SystemProgram.createAccount({
                fromPubkey: owner,
                newAccountPubkey: mint_account.publicKey,
                space: MintLayout.span,
                lamports: mint_rent,
                programId: TOKEN_PROGRAM_ID,
            });

            if (isChecked) {
                InitMint = await createInitializeMintInstruction(
                    mint_account.publicKey,
                    decimals,
                    owner,
                    owner,
                    TOKEN_PROGRAM_ID,
                );

            } else {
                InitMint = await createInitializeMintInstruction(
                    mint_account.publicKey,
                    decimals,
                    owner,
                    null,
                    TOKEN_PROGRAM_ID,
                );

            };

            const associatedTokenAccount = await getAssociatedTokenAddressSync(
                mint_account.publicKey,
                owner,
                false,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID,
            );

            const createATAInstruction = await createAssociatedTokenAccountInstruction(
                owner,
                associatedTokenAccount,
                owner,
                mint_account.publicKey,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID,
            );

            const mintInstruction = await createMintToInstruction(
                mint_account.publicKey,
                associatedTokenAccount,
                owner,
                quantity * 10 ** decimals,
                [],
                TOKEN_PROGRAM_ID,
            );


            const MetadataInstruction = createCreateMetadataAccountV3Instruction(
                {
                    metadata: metadataPDA,
                    mint: mint_account.publicKey,
                    mintAuthority: owner,
                    payer: owner,
                    updateAuthority: owner,
                },
                {
                    createMetadataAccountArgsV3: args,
                }
            );

            console.log("confirming");
            if (wallet.publicKey == null) return;
            const createAccountTransaction = new Transaction().add(createMintAccountInstruction, InitMint, createATAInstruction, mintInstruction, MetadataInstruction);
            if (wallet.signTransaction == undefined) return undefined;
            const blockHash = await connection.getLatestBlockhash();
            createAccountTransaction.recentBlockhash = blockHash.blockhash;
            createAccountTransaction.feePayer = wallet.publicKey;

            // const signedTX = await wallet.signTransaction(createAccountTransaction);

            // const createAccountSignature = await sendAndConfirmTransaction(connection, signedTX, [mint_account]);
            // console.log(await connection.simulateTransaction(createAccountTransaction));

            const createAccountSignature = await wallet.sendTransaction(createAccountTransaction, connection, { signers: [mint_account] });

            console.log("createAccountSignature ===>", createAccountSignature);
            // return mint_account.publicKey;
            const createAccountconfirmed = await connection.confirmTransaction(createAccountSignature, 'confirmed');
            if (createAccountconfirmed)
                return mint_account.publicKey;
            return undefined;
            // const signature = createAccountSignature.toString()


            // if (createAccountconfirmed) {
            //     console.log("confirmed: ", signature);
            //     return mint_account.publicKey;
            //     // setIscreating(false);
            //     // setTokenAddresss(mint_account.publicKey.toBase58());
            //     // setSignature(signature)
            // }
            // const newToken = new Token(connection, mint_account.publicKey, TOKEN_PROGRAM_ID, [wallet.publicKey]);
        }

    } catch (error) {
        console.log("error: ", error);
        // setIscreating(false);
        // const err = (error as any)?.message;
        // setError(err)
    }

}