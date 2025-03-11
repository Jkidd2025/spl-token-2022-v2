const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

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

// Get and display public keys
console.log('\nWallet Public Keys:');
console.log('------------------');
console.log(`Token Authority: ${getPublicKeyFromFile(tokenAuthorityPath)}`);
console.log(`Mint Authority: ${getPublicKeyFromFile(mintAuthorityPath)}`);
console.log(`Treasury: ${getPublicKeyFromFile(treasuryPath)}`); 