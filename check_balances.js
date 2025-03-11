const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

// Connect to devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Function to read keypair from file
function readKeypairFromFile(filePath) {
    const secretKey = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

// Function to get public key from file
function getPublicKeyFromFile(filePath) {
    const keypair = readKeypairFromFile(filePath);
    return keypair.publicKey.toBase58();
}

// Get wallet paths
const walletsDir = path.join(__dirname, 'wallets');
const tokenAuthorityPath = path.join(walletsDir, 'token-authority.json');
const mintAuthorityPath = path.join(walletsDir, 'mint-authority.json');
const treasuryPath = path.join(walletsDir, 'treasury.json');

// Get public keys
const tokenAuthorityPubkey = getPublicKeyFromFile(tokenAuthorityPath);
const mintAuthorityPubkey = getPublicKeyFromFile(mintAuthorityPath);
const treasuryPubkey = getPublicKeyFromFile(treasuryPath);

// Function to check balance
async function checkBalance(publicKey, walletName) {
    try {
        const balance = await connection.getBalance(new PublicKey(publicKey));
        console.log(`${walletName}: ${balance / 1e9} SOL`);
        return balance;
    } catch (error) {
        console.error(`Error checking balance for ${walletName}:`, error.message);
        return 0;
    }
}

// Check all balances
async function checkAllBalances() {
    console.log('\nChecking SOL balances on devnet:');
    console.log('--------------------------------');
    
    await checkBalance(tokenAuthorityPubkey, 'Token Authority');
    await checkBalance(mintAuthorityPubkey, 'Mint Authority');
    await checkBalance(treasuryPubkey, 'Treasury');
}

checkAllBalances(); 