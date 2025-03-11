const { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { createUpdateMetadataAccountV2Instruction } = require('@metaplex-foundation/mpl-token-metadata');
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

        // Load token authority keypair (which should be the current update authority)
        const updateAuthorityKeypair = loadKeypair('./wallets/token-authority.json');
        
        // Get token mint
        const mintPubkey = new PublicKey(config.tokenMint);

        // Get metadata PDA
        const [metadataPDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('metadata'),
                new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
                mintPubkey.toBuffer(),
            ],
            new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
        );

        // Create transaction to update metadata and remove update authority
        const transaction = new Transaction().add(
            createUpdateMetadataAccountV2Instruction(
                {
                    metadata: metadataPDA,
                    updateAuthority: updateAuthorityKeypair.publicKey,
                },
                {
                    updateMetadataAccountArgsV2: {
                        data: null, // Keep existing data
                        updateAuthority: null, // Set to null to remove update authority
                        primarySaleHappened: null, // Keep existing value
                        isMutable: false, // Make metadata immutable
                    }
                }
            )
        );

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = updateAuthorityKeypair.publicKey;
        transaction.lastValidBlockHeight = lastValidBlockHeight;

        // Sign and send transaction
        console.log('Disabling metadata update authority...');
        transaction.sign(updateAuthorityKeypair);
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

        console.log('Metadata update authority has been successfully disabled!');
        console.log('Signature:', signature);
        console.log('\nThe token metadata is now immutable and cannot be changed.');

    } catch (error) {
        console.error('Error disabling metadata update authority:', error.message);
        process.exit(1);
    }
}

function loadKeypair(filePath) {
    const secretKey = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

main(); 