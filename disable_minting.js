const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, createSetAuthorityInstruction, AuthorityType } = require('@solana/spl-token');
const fs = require('fs');

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

        // Load mint authority keypair
        const mintAuthorityKeypair = loadKeypair('./wallets/mint-authority.json');
        
        // Get token mint
        const mintPubkey = new PublicKey(config.tokenMint);

        // Create transaction to disable mint authority
        const transaction = new Transaction().add(
            createSetAuthorityInstruction(
                mintPubkey,                    // mint account
                mintAuthorityKeypair.publicKey, // current authority
                AuthorityType.MintTokens,      // authority type
                null                           // new authority (null to disable)
            )
        );

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = mintAuthorityKeypair.publicKey;
        transaction.lastValidBlockHeight = lastValidBlockHeight;

        // Sign and send transaction
        console.log('Disabling mint authority...');
        transaction.sign(mintAuthorityKeypair);
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

        console.log('Mint authority has been successfully disabled!');
        console.log('Signature:', signature);
        console.log('\nNo more tokens can be minted. The supply is now fixed at 1 billion SMS tokens.');

    } catch (error) {
        console.error('Error disabling mint authority:', error.message);
        process.exit(1);
    }
}

function loadKeypair(filePath) {
    const secretKey = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

main(); 