const { Connection } = require('@solana/web3.js');
const fs = require('fs');
const WalletManager = require('./src/managers/WalletManager');
const TokenManager = require('./src/managers/TokenManager');
require('dotenv').config();

// Load configuration
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

async function displayTokenInfo(tokenManager, mintPubkey, tokenAccounts) {
    console.log('\n=== Token Information ===');
    
    // Get balances for token accounts
    console.log('\nToken Account Balances:');
    for (const [name, account] of Object.entries(tokenAccounts)) {
        const balance = await tokenManager.getTokenBalance(account);
        console.log(`  ${name}:`, balance);
    }
}

async function main() {
    try {
        // Create connection to devnet
        const connection = new Connection(config.network.endpoint);
        console.log('Connecting to Solana devnet...');

        // Initialize managers
        const walletManager = new WalletManager(connection, config);
        const tokenManager = new TokenManager(connection, config);
        
        // Display initial balances
        console.log('\nChecking wallet balances...');
        await walletManager.checkAllWallets();

        // Create new token
        console.log('\nCreating new SPL Token...');
        const mintPubkey = await tokenManager.createToken(6);  // 6 decimals

        // Create token accounts
        console.log('\nCreating token accounts...');
        const tokenAccounts = {
            Treasury: await tokenManager.createTokenAccount(
                config.wallets.treasury.publicKey,
                mintPubkey
            ),
            Recipient: await tokenManager.createTokenAccount(
                config.wallets.tokenAuthority.publicKey,
                mintPubkey
            )
        };

        // Mint initial supply to treasury
        console.log('\nMinting initial supply to treasury...');
        const initialSupply = 1000000000; // 1 billion tokens
        await tokenManager.mintToken(
            mintPubkey,
            tokenAccounts.Treasury,
            initialSupply
        );

        // Display token information
        await displayTokenInfo(tokenManager, mintPubkey, tokenAccounts);

        // Transfer tokens
        console.log('\nTransferring tokens...');
        const transferAmount = 1000000; // 1 million tokens
        await tokenManager.transferTokens(
            tokenAccounts.Treasury,
            tokenAccounts.Recipient,
            transferAmount
        );

        // Display final token information
        console.log('\nFinal token state:');
        await displayTokenInfo(tokenManager, mintPubkey, tokenAccounts);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();