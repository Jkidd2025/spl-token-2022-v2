const { Connection } = require('@solana/web3.js');
const TokenManager = require('./src/managers/TokenManager');
const fs = require('fs');
const https = require('https');

async function validateMetadataUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                reject(new Error(`Metadata URL returned status code: ${res.statusCode}`));
            }
        }).on('error', (err) => {
            reject(new Error(`Error validating metadata URL: ${err.message}`));
        });
    });
}

async function retryWithBackoff(operation, maxRetries = 3, initialDelay = 2000) {
    let lastError;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxRetries}...`);
            return await operation();
        } catch (error) {
            lastError = error;
            if (attempt === maxRetries) break;
            
            console.log(`Attempt ${attempt} failed: ${error.message}`);
            console.log(`Retrying in ${delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        }
    }
    throw lastError;
}

async function main() {
    try {
        // Load and validate configuration
        if (!fs.existsSync('./config.json')) {
            throw new Error('config.json not found');
        }
        
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
        
        // Validate config structure
        if (!config.network?.endpoint || !config.wallets?.treasury?.publicKey) {
            throw new Error('Invalid config structure');
        }
        
        // Connect to devnet with increased timeouts
        const connection = new Connection(config.network.endpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 120000, // 2 minutes
            preflightCommitment: 'confirmed',
            timeout: 120000
        });
        
        // Initialize token manager
        const tokenManager = new TokenManager(connection);

        console.log('Creating Stealth Mode Startup ($SMS) token...');

        // 1. Create token mint with retry
        console.log('\nStep 1: Creating token mint...');
        const mintPubkey = await retryWithBackoff(async () => {
            return await tokenManager.createTokenMint();
        });
        console.log('Token mint created:', mintPubkey.toBase58());

        // 2. Create metadata
        console.log('\nStep 2: Creating token metadata...');
        const metadata = {
            name: "Stealth Mode Startup",
            symbol: "SMS",
            uri: "https://raw.githubusercontent.com/Jkidd2025/spl-token-2022-v2/main/assets/metadata.json"
        };

        // Validate metadata URL before proceeding
        await validateMetadataUrl(metadata.uri);
        console.log('Metadata URL validated successfully');

        const metadataPda = await retryWithBackoff(async () => {
            return await tokenManager.createTokenMetadata(mintPubkey, metadata);
        });
        console.log('Metadata created:', metadataPda.toBase58());

        // 3. Create Treasury token account with retry
        console.log('\nStep 3: Creating Treasury token account...');
        const treasuryPubkey = config.wallets.treasury.publicKey;
        const treasuryATA = await retryWithBackoff(async () => {
            return await tokenManager.createTokenAccount(treasuryPubkey);
        });
        console.log('Treasury token account created:', treasuryATA.toBase58());

        // 4. Mint initial supply to Treasury with retry
        console.log('\nStep 4: Minting initial supply...');
        const initialSupply = 1_000_000_000; // 1 billion
        await retryWithBackoff(async () => {
            return await tokenManager.mintTokens(initialSupply, treasuryATA);
        });

        // 5. Get and display token balance with retry
        console.log('\nStep 5: Verifying token balance...');
        const balance = await retryWithBackoff(async () => {
            return await tokenManager.getTokenBalance(treasuryATA);
        });
        console.log('Treasury token balance:', balance.uiAmount, metadata.symbol);

        console.log('\nToken creation completed successfully!');
        console.log('Token Mint:', mintPubkey.toBase58());
        console.log('Metadata Account:', metadataPda.toBase58());
        console.log('Treasury Token Account:', treasuryATA.toBase58());
        
    } catch (error) {
        console.error('Error creating token:', error.message);
        process.exit(1);
    }
}

main(); 