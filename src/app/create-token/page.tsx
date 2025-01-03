'use client';
import { useState, useRef, useEffect } from 'react';
import ConnectButton from "@/components/ConnectButton";
import Header from "@/components/Header";
// import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { toMetaplexFileFromBrowser } from '@metaplex-foundation/js';
import { createSPLToken } from '@/contexts/createSPLToken';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import LandingHeader from '@/components/LandingHeader/LandingHeader';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MarketV2, DEVNET_PROGRAM_ID } from '@raydium-io/raydium-sdk';
// import { createMarket } from '@/contexts/createMarket';
import { createMarket } from '@/contexts/createMarket-main';
import { PublicKey } from '@solana/web3.js';
import { revokeMintAuthority } from '@/contexts/revokeMintAuthority';
import { revokeFreezeAuthority } from '@/contexts/revokeFreezeAuthority';
import { createLiquidity } from '@/contexts/createLiquidity';
import { burnToken } from '@/contexts/burnToken';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { Snackbar } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import MintingComponent from '../mint-component/page';


interface AlertState {
    open: boolean
    message: string
    severity: 'success' | 'info' | 'warning' | 'error' | undefined
}

let mintAddress: PublicKey | undefined = undefined;
let marketId: PublicKey | null | undefined = null;
let lpMint: PublicKey | null | undefined = null;

export default function CreateToken() {

    const wallet = useWallet()
    const { connection } = useConnection()
    const router = useRouter();
    const [tokenName, setTokenName] = useState("")
    const [tokenSymbol, setTokenSymbol] = useState("")
    const [tokenLogo, setTokenLogo] = useState<File | null>()
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [tokenDecimal, setTokenDecimal] = useState(9)
    const [tokenBalance, setTokenBalance] = useState(0)
    const [solBalance, setSolBalance] = useState('0')
    const [alertState, setAlertState] = useState<AlertState>({
        open: false,
        message: '',
        severity: undefined,
    })
    const [marketPrice, setMarketPrice] = useState<number>(0);
    // const [isShowOrigin, setIsShowOrigin] = useState(false);
    // const wallet = useWallet();
    // const [loading, setLoading] = useState(false);
    // const handleNftStake = async () => {
    //   if (!mint) return;
    //   try {
    //     const tx = await stakeNFT(wallet, mint, setLoading);
    //     if (!tx || !wallet.publicKey) return;
    //     await stake(tx, wallet.publicKey?.toBase58(), setLoading, getNfts);
    //   } catch (err) {
    //     console.log(err);
    //   }
    // };
    const [step, setStep] = useState(1);

    useEffect(()=> {
        const input = document.getElementsByName('market_price');
        console.log("input ===>", input);
    }, [])


    const sendLanding = () => {
        router.push('/');
    }
    const handleCreateToken = async () => {

        // setStep(2);
        // return;
        if (
            tokenName != "" &&
            tokenSymbol != "" &&
            tokenLogo != null &&
            tokenBalance != 0
        ) {
            if (!wallet.publicKey) return;
            const _file = await toMetaplexFileFromBrowser(tokenLogo);
            console.log("file ====>", _file);
            console.log("wallet publicKey ===>", wallet.publicKey, wallet);
            console.log("connection ===>", connection);
            console.log("tokenBalance ===>", tokenBalance);
            console.log("tokenName ===>", tokenName);
            console.log("tokenSymbol ===>", tokenSymbol);
            setAlertState({
                open: true,
                message: 'Transaction is in progress...',
                severity: 'info',
            })
            mintAddress = await createSPLToken(wallet.publicKey, wallet, connection, tokenBalance, tokenDecimal, true, tokenName, tokenSymbol, "", "", _file, "string")
            setAlertState({
                open: false,
                message: 'Done',
                severity: 'info',
            })
        } else {
            setAlertState({
                open: true,
                message: 'Invalid params',
                severity: 'error',
            })
            return;
            // alert("Invalid params")
        }
        setStep(2);
    }

    const handleCreateMarket = async () => {
        // setStep(5);
        // alert(marketPrice);
        // return ;

        if(marketPrice == 0) {
            setAlertState({
                open: true,
                message: 'You have to set market option...',
                severity: 'error',
            });
            // setTimeout(() => {}, 3000);
            return ;
        }

        // const baseMint = new PublicKey('EaGjiUc41cfz45EBGC95ALXdi8MhJcdTPk35kQtT5pJc');
        const baseMint = mintAddress != undefined ? mintAddress : new PublicKey("AXVANX9Exmoghok94dQkdLbQddpe9NjQkQ9heEcauDiF");
        const baseDecimal = tokenDecimal;
        const quoteMint = new PublicKey("So11111111111111111111111111111111111111112");
        const quoteDecimal = 9;
        const orderSize = 1;
        const tickSize = 0.01;
        setAlertState({
            open: true,
            message: 'Loading...',
            severity: 'info',
        })
        // marketId = await createMarket(connection, wallet, baseMint, baseDecimal, quoteMint, quoteDecimal, orderSize, tickSize);
        marketId = await createMarket(connection, wallet, baseMint, marketPrice);
        console.log("creating market id ====>", marketId?.toBase58());
        setAlertState({
            open: false,
            message: 'Done',
            severity: 'info',
        })
        setStep(5);
    }

    const handleNameChange = (value: string) => {
        setTokenName(value)
    }
    const handleSymbolChange = (value: string) => {
        setTokenSymbol(value)
    }
    const handleLogoFileChange = (files: FileList | null) => {
        if (files) {
            setTokenLogo(files[0])
            if (files[0]) {
                const imageUrls = Object.values(files).map((file) => URL.createObjectURL(file));
                setImageUrl(imageUrls[0]);
            }
        } else {
            setImageUrl('');
            setTokenLogo(null)
        }
    }
    const handleDecimalChange = (value: string) => {
        setTokenDecimal(parseInt(value))
    }
    const handleBalanceChange = (value: string) => {
        setTokenBalance(parseInt(value))
    }
    const handleSolBalanceChange = (value: string) => {
        setSolBalance(value);

        // alert(value);
    }

    const clickRevokeMint = async () => {
        // setStep(3);
        // return;
        if (mintAddress == undefined) {
            setAlertState({
                open: true,
                message: 'Mint Address Not Set',
                severity: 'error',
            })
            // alert("mint address is not set");
            return;
        }
        if (wallet.publicKey == null) {
            setAlertState({
                open: true,
                message: 'Wallet Not Configured',
                severity: 'error',
            })
            // alert("wallet is not configured");
            return;
        }
        const mint = mintAddress;
        console.log("revoke mint :mint ===>", mint.toBase58())
        setAlertState({
            open: true,
            message: 'Transaction is in progress...',
            severity: 'info',
        })
        await revokeMintAuthority(connection, wallet, mint);
        setAlertState({
            open: false,
            message: 'Done',
            severity: 'info',
        })
        setStep(3);
    }

    const clickRevokeFreeze = async () => {
        // setStep(4);
        // return;
        if (mintAddress == undefined) {
            setAlertState({
                open: true,
                message: 'Mint Address Not Set',
                severity: 'error',
            })
            // alert("mint address is not set");
            return;
        }
        const mint = mintAddress;
        console.log("revoke freeze: mint ==>", mint.toBase58());
        setAlertState({
            open: true,
            message: 'Transaction is in progress...',
            severity: 'info',
        })
        await revokeFreezeAuthority(connection, wallet, mint);
        setAlertState({
            open: false,
            message: 'Done',
            severity: 'info',
        })
        setStep(4);
    }
    // LP Mint : GozTnFTuSphKc8V2rGnaUm56WGBFnWS3W99iPzhRFv6n
    // AMM Id : CVtUnBf87fD3W3v1hcZ9kzXKSHDXjdXpDS6stFTYEPyp


    // marketId : krnKbe4BiwN7rDDhto1kmnxJttXPnM5u8JDYbMSUL93
    // AMM Id : DeaKJBnzRZEEGwfx9TLUSd6YHZuFqtLV9zCUj5PY8Aw8
    const clickAddLiquidity = async () => {
        // setStep(6);
        // return ;
        if (marketId == undefined) {
            setAlertState({
                open: true,
                message: 'MarketID not Set',
                severity: 'error',
            })
            // alert("marketId is not set");
            return;
        }
        if (mintAddress == undefined) {
            setAlertState({
                open: true,
                message: 'Mint Address Not Set',
                severity: 'error',
            })
            // alert("mint address is not set");
            return;
        }

        console.log("Liquidity marketId ====>", marketId);
        const baseMint = mintAddress;
        // const baseMint = new PublicKey("24rsNkc3Xg5mMhPKLi5LvxkY7eS2R9d3CiaqGKUCEa4J");
        const baseDecimal = tokenDecimal;
        const quoteMint = new PublicKey("So11111111111111111111111111111111111111112");
        const quoteDecimal = 9;
        const orderSize = 1;
        const tickSize = 0.01;
        // const marketId1 = new PublicKey("krnKbe4BiwN7rDDhto1kmnxJttXPnM5u8JDYbMSUL93");
        // const balanceElement = document.getElementById("sol-balance");
        // if (balanceElement == null) return;
        console.log("mintaddress ==>", baseMint.toBase58());
        console.log("solbalance ===>", parseFloat(solBalance));
        setAlertState({
            open: true,
            message: 'Transaction is in progress...',
            severity: 'info',
        })
        lpMint = await createLiquidity(connection, wallet, baseMint, baseDecimal, quoteMint, quoteDecimal, orderSize, tickSize, marketId, tokenBalance, parseFloat(solBalance));
        setAlertState({
            open: false,
            message: 'Done',
            severity: 'info',
        })
        setStep(6);
    }

    const clickBurnToken = async () => {
        // setStep(1);
        // return;
        if (wallet.publicKey == null) {
            setAlertState({
                open: true,
                message: 'Wallet Not Configured Yet',
                severity: 'error',
            })
            // alert("wallet is not configured yet");
            return;
        }
        if (lpMint == undefined || null) {
            setAlertState({
                open: true,
                message: 'No LP Token Exist',
                severity: 'error',
            })
            // alert("no LP token exist");
            return;
        }
        const mint = lpMint;
        console.log('lpMint ===>', lpMint);
        const tokenAccountAddress = await getAssociatedTokenAddressSync(mint, wallet.publicKey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,);
        console.log('tokenAccountAddress ===>', tokenAccountAddress.toBase58());
        setAlertState({
            open: true,
            message: 'Transaction is in progress...',
            severity: 'error',
        })
        await burnToken(connection, wallet, mint, tokenAccountAddress);
        setAlertState({
            open: false,
            message: 'Done',
            severity: 'info',
        })
        setStep(1);
    }

    const fileInputRef = useRef<HTMLInputElement>(null);
    const radioInputRef1 = useRef<HTMLInputElement>(null);
    const radioInputRef2 = useRef<HTMLInputElement>(null);
    const radioInputRef3 = useRef<HTMLInputElement>(null);
    const handleBig = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };
    return (
        <div className="w-full h-full min-h-screen flex items-start pt-6 sm:pt-0 sm:items-center justify-center bg-secondary-200  sm:bg-secondary-300">
            <LandingHeader />
            <MintingComponent setAlertState={setAlertState} />
            <Snackbar
                open={alertState.open}
                autoHideDuration={20000}
                onClose={() => setAlertState({ ...alertState, open: false })}
            >
                <Alert
                    onClose={() => setAlertState({ ...alertState, open: false })}
                    severity={alertState.severity}
                    className='text-[red]'
                >
                    {alertState.message}
                </Alert>
            </Snackbar>
        </div>
    );
}
