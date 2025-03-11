const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const { 
    TOKEN_PROGRAM_ID,
    createTransferInstruction,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // Load configuration
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
        
        // Connect to devnet
        const connection = new Connection(config.network.endpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 120000,
            preflightCommitment: 'confirmed',
            timeout: 120000
        });

        // Load Treasury keypair (source)
        const treasuryKeypair = loadKeypair('./wallets/treasury.json');
        
        // Load test wallet public key (destination)
        const testWalletPubkey = new PublicKey('5GL8Ffo7dDmqKjiDZFWkUvxqB141ezcaRnX3QnwAq4XF');
        
        // Get token mint
        const mintPubkey = new PublicKey(config.tokenMint);

        // Get source token account (Treasury's ATA)
        const sourceATA = await getAssociatedTokenAddress(
            mintPubkey,
            treasuryKeypair.publicKey
        );

        // Get destination token account (Test wallet's ATA)
        const destinationATA = await getAssociatedTokenAddress(
            mintPubkey,
            testWalletPubkey
        );

        // Check if destination token account exists
        const destinationAccount = await connection.getAccountInfo(destinationATA);
        
        // Create transaction
        const transaction = new Transaction();
        
        // If destination token account doesn't exist, create it
        if (!destinationAccount) {
            console.log('Creating token account for recipient...');
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    treasuryKeypair.publicKey,
                    destinationATA,
                    testWalletPubkey,
                    mintPubkey
                )
            );
        }

        // Add transfer instruction
        const amount = 1000 * Math.pow(10, 6); // Transfer 1000 tokens
        transaction.add(
            createTransferInstruction(
                sourceATA,
                destinationATA,
                treasuryKeypair.publicKey,
                amount
            )
        );

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = treasuryKeypair.publicKey;
        transaction.lastValidBlockHeight = lastValidBlockHeight;

        // Sign and send transaction
        console.log('Sending tokens...');
        transaction.sign(treasuryKeypair);
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
            maxRetries: 5
        });

        // Wait for confirmation
        console.log('Waiting for confirmation...');
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });

        if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        console.log('Transfer completed successfully!');
        console.log('Signature:', signature);

        // Get new balances
        const sourceBalance = await connection.getTokenAccountBalance(sourceATA);
        const destBalance = await connection.getTokenAccountBalance(destinationATA);

        console.log('\nNew balances:');
        console.log('Treasury:', sourceBalance.value.uiAmount, 'SMS');
        console.log('Test Wallet:', destBalance.value.uiAmount, 'SMS');

    } catch (error) {
        console.error('Error transferring tokens:', error.message);
        process.exit(1);
    }
}

function loadKeypair(filePath) {
    const secretKey = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

main(); 