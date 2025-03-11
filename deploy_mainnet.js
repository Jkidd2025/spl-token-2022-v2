const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    try {
        console.log('\n🚀 Starting mainnet deployment preparation...\n');

        // Load mainnet configuration
        const config = JSON.parse(fs.readFileSync('./config.mainnet.json', 'utf-8'));
        
        // Connect to mainnet
        const connection = new Connection(config.network.endpoint, {
            commitment: config.network.commitment,
            confirmTransactionInitialTimeout: 120000
        });

        console.log('⚠️  MAINNET DEPLOYMENT CHECKLIST\n');
        console.log('Please verify the following information carefully:\n');

        // 1. Verify network connection
        console.log('1️⃣  Network Connection:');
        const version = await connection.getVersion();
        console.log(`   ✓ Connected to Solana mainnet-beta (${version['solana-core']})\n`);

        // 2. Check wallet files
        console.log('2️⃣  Wallet Files:');
        const walletFiles = [
            './wallets/token-authority.json',
            './wallets/mint-authority.json',
            './wallets/treasury.json'
        ];

        for (const walletFile of walletFiles) {
            if (!fs.existsSync(walletFile)) {
                throw new Error(`Missing wallet file: ${walletFile}`);
            }
            const keypair = loadKeypair(walletFile);
            const balance = await connection.getBalance(keypair.publicKey);
            console.log(`   ✓ ${path.basename(walletFile)}: ${balance / LAMPORTS_PER_SOL} SOL`);
        }
        console.log('');

        // 3. Verify token details
        console.log('3️⃣  Token Configuration:');
        console.log(`   • Name: ${config.token.name}`);
        console.log(`   • Symbol: ${config.token.symbol}`);
        console.log(`   • Decimals: ${config.token.decimals}`);
        console.log(`   • Initial Supply: ${config.token.initialSupply}`);
        console.log(`   • Metadata URI: ${config.token.uri}\n`);

        // 4. Check metadata accessibility
        console.log('4️⃣  Metadata Verification:');
        try {
            const response = await fetch(config.token.uri);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const metadata = await response.json();
            console.log('   ✓ Metadata JSON is accessible and valid\n');
        } catch (error) {
            throw new Error(`Metadata URI is not accessible: ${error.message}`);
        }

        // 5. Estimated costs
        console.log('5️⃣  Estimated Costs:');
        console.log('   • Token creation: ~0.5 SOL');
        console.log('   • Metadata creation: ~0.5 SOL');
        console.log('   • Initial supply minting: ~0.01 SOL');
        console.log('   • Total estimated cost: ~1.01 SOL\n');

        // Get user confirmation
        console.log('⚠️  IMPORTANT SECURITY NOTES:');
        console.log('1. This deployment will create an immutable token on mainnet');
        console.log('2. The mint authority will be permanently disabled after initial supply');
        console.log('3. The metadata will be permanently immutable');
        console.log('4. These actions cannot be reversed\n');

        const confirm = await question('Are you sure you want to proceed with mainnet deployment? (yes/no): ');
        
        if (confirm.toLowerCase() !== 'yes') {
            console.log('\n❌ Deployment cancelled by user');
            process.exit(0);
        }

        const confirmAgain = await question('\nType DEPLOY to confirm mainnet deployment: ');
        
        if (confirmAgain !== 'DEPLOY') {
            console.log('\n❌ Deployment cancelled by user');
            process.exit(0);
        }

        console.log('\n✅ Deployment preparation complete!');
        console.log('\nNext steps:');
        console.log('1. Run create_token.js with --mainnet flag');
        console.log('2. Run disable_minting.js with --mainnet flag');
        console.log('3. Run disable_metadata_updates.js with --mainnet flag');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

function loadKeypair(filePath) {
    const secretKey = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

main(); 