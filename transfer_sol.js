const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

// Connect to devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Function to read keypair from file
function readKeypairFromFile(filePath) {
    const secretKey = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

// Get wallet paths
const walletsDir = path.join(__dirname, 'wallets');
const tokenAuthorityPath = path.join(walletsDir, 'token-authority.json');
const treasuryPath = path.join(walletsDir, 'treasury.json');

// Get keypairs
const tokenAuthorityKeypair = readKeypairFromFile(tokenAuthorityPath);
const treasuryKeypair = readKeypairFromFile(treasuryPath);

async function transferSOL() {
    try {
        // Create transaction
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: tokenAuthorityKeypair.publicKey,
                toPubkey: treasuryKeypair.publicKey,
                lamports: LAMPORTS_PER_SOL // 1 SOL
            })
        );

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = tokenAuthorityKeypair.publicKey;

        // Sign and send transaction
        console.log('Sending transaction...');
        const signature = await connection.sendTransaction(
            transaction,
            [tokenAuthorityKeypair]
        );

        // Wait for confirmation
        console.log('Waiting for confirmation...');
        const confirmation = await connection.confirmTransaction(signature);
        
        if (confirmation.value.err) {
            throw new Error('Transaction failed');
        }

        console.log('Transaction successful!');
        console.log('Signature:', signature);

        // Check new balances
        console.log('\nNew balances:');
        const tokenAuthorityBalance = await connection.getBalance(tokenAuthorityKeypair.publicKey);
        const treasuryBalance = await connection.getBalance(treasuryKeypair.publicKey);
        
        console.log(`Token Authority: ${tokenAuthorityBalance / LAMPORTS_PER_SOL} SOL`);
        console.log(`Treasury: ${treasuryBalance / LAMPORTS_PER_SOL} SOL`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

transferSOL(); 