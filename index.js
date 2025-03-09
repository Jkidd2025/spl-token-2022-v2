const { Connection } = require('@solana/web3.js');
const fs = require('fs');
const WalletManager = require('./src/managers/WalletManager');
const TokenManager = require('./src/managers/TokenManager');

// Load configuration
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

async function displayTokenInfo(tokenManager, mintPubkey, tokenAccounts) {
    console.log('\n=== Token Information ===');
    
    // Get mint info
    const mintInfo = await tokenManager.getMintInfo(mintPubkey);
    console.log('\nMint Info:');
    console.log('  Supply:', mintInfo.supply);
    console.log('  Decimals:', mintInfo.decimals);
    console.log('  Mint Authority:', mintInfo.mintAuthority);
    console.log('  Freeze Authority:', mintInfo.freezeAuthority);
    console.log('  Program ID:', mintInfo.programId);
    
    if (mintInfo.extensions) {
        console.log('  Extensions:', mintInfo.extensions.join(', '));
    }

    // Get metadata
    try {
        const metadata = await tokenManager.getTokenMetadata(mintPubkey);
        console.log('\nMetadata:');
        console.log('  Name:', metadata.name);
        console.log('  Symbol:', metadata.symbol);
        console.log('  URI:', metadata.uri);
    } catch (error) {
        console.log('\nNo metadata found');
    }

    // Get token account info
    console.log('\nToken Account Balances:');
    for (const [name, account] of Object.entries(tokenAccounts)) {
        const balance = await tokenManager.getTokenBalance(account);
        console.log(`  ${name}:`, balance);
    }
}

async function main() {
    try {
        // Create connection to devnet
        const connection = new Connection(
            config.network.endpoint,
            {
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 60000,
                wsEndpoint: 'wss://api.devnet.solana.com/'
            }
        );

        console.log('Connecting to Solana devnet...');
        const slot = await connection.getSlot();
        console.log('Successfully connected to Solana devnet!');
        console.log('Current slot:', slot);

        // Initialize managers
        const walletManager = new WalletManager(connection, config);
        const tokenManager = new TokenManager(connection, config);
        
        // Display initial balances
        console.log('\nChecking wallet balances...');
        await walletManager.checkAllWallets();

        // Create new token with metadata and transfer fee
        console.log('\nCreating new SPL Token 2022 with metadata and transfer fee...');
        
        /**
         * Token metadata configuration
         * This defines the basic properties of the token
         */
        const tokenMetadata = {
            name: "Sample Token",
            symbol: "SMPL",
            uri: "metadata.json",
            decimals: 6
        };

        /**
         * Create the token using TokenManager
         * Note: We're not passing a transfer fee configuration here
         * This means the token will use the default 5% fee configuration from TokenManager
         * 
         * If we wanted to use a custom fee, we could do it like this:
         * const customFeeConfig = {
         *     authority: config.wallets.feeCollector.publicKey,
         *     withdrawWithheldAuthority: config.wallets.feeCollector.publicKey,
         *     feeBasisPoints: 300, // 3% instead of 5%
         *     maxFee: BigInt(0)
         * };
         * 
         * And then pass it as the fourth parameter:
         * tokenManager.createToken(
         *     config.wallets.mintAuthority.publicKey,
         *     config.wallets.freezeAuthority.publicKey,
         *     tokenMetadata.decimals,
         *     customFeeConfig
         * );
         */
        const mintPubkey = await tokenManager.createToken(
            config.wallets.mintAuthority.publicKey,
            config.wallets.freezeAuthority.publicKey,
            tokenMetadata.decimals
        );

        /**
         * Create token accounts for:
         * 1. Treasury - holds the initial token supply
         * 2. FeeCollector - collects the 5% transfer fees
         */
        console.log('\nCreating token accounts...');
        const tokenAccounts = {
            Treasury: await tokenManager.createTokenAccount(
                config.wallets.treasury.publicKey,
                mintPubkey
            ),
            FeeCollector: await tokenManager.createTokenAccount(
                config.wallets.feeCollector.publicKey,
                mintPubkey
            )
        };

        // Mint initial supply to treasury
        console.log('\nMinting initial supply to treasury...');
        const initialSupply = 1000000000; // 1 billion tokens
        await tokenManager.mintToken(
            mintPubkey,
            tokenAccounts.Treasury,
            config.wallets.mintAuthority.publicKey,
            initialSupply
        );

        // Display initial token information
        await displayTokenInfo(tokenManager, mintPubkey, tokenAccounts);

        /**
         * Demonstrate transfer with fee
         * When transferring 10,000 tokens:
         * - 9,500 tokens will arrive at the destination (95%)
         * - 500 tokens will go to the fee collector (5%)
         */
        console.log('\nTransferring tokens with fee...');
        const transferAmount = 10000 * Math.pow(10, tokenMetadata.decimals); // 10,000 tokens
        await tokenManager.transferTokens(
            tokenAccounts.Treasury,
            tokenAccounts.FeeCollector,
            config.wallets.treasury.publicKey,
            transferAmount
        );

        // Display final token information to show the fee collection
        console.log('\nFinal token state after transfer:');
        await displayTokenInfo(tokenManager, mintPubkey, tokenAccounts);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();