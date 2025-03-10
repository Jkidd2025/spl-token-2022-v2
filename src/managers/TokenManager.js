const { 
    Connection, 
    Keypair, 
    PublicKey, 
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction
} = require('@solana/web3.js');
const { 
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createMintToInstruction,
    createTransferInstruction
} = require('@solana/spl-token');
const { 
    Metadata,
    DataV2
} = require('@metaplex-foundation/mpl-token-metadata');
const fs = require('fs');
require('dotenv').config();

class TokenManager {
    constructor(connection, config) {
        this.connection = connection;
        this.config = config;
        this.programId = TOKEN_PROGRAM_ID;

        // Initialize keypairs from environment variables
        this.initializeKeypairs();
    }

    initializeKeypairs() {
        try {
            // Convert private key strings to Uint8Array
            const tokenAuthorityPrivateKey = process.env.TOKEN_AUTHORITY_PRIVATE_KEY
                ? new Uint8Array(JSON.parse(process.env.TOKEN_AUTHORITY_PRIVATE_KEY))
                : null;
            
            const mintAuthorityPrivateKey = process.env.MINT_AUTHORITY_PRIVATE_KEY
                ? new Uint8Array(JSON.parse(process.env.MINT_AUTHORITY_PRIVATE_KEY))
                : null;
            
            const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY
                ? new Uint8Array(JSON.parse(process.env.TREASURY_PRIVATE_KEY))
                : null;

            // Create keypairs
            this.tokenAuthorityKeypair = tokenAuthorityPrivateKey 
                ? Keypair.fromSecretKey(tokenAuthorityPrivateKey)
                : null;
            
            this.mintAuthorityKeypair = mintAuthorityPrivateKey
                ? Keypair.fromSecretKey(mintAuthorityPrivateKey)
                : null;
            
            this.treasuryKeypair = treasuryPrivateKey
                ? Keypair.fromSecretKey(treasuryPrivateKey)
                : null;

        } catch (error) {
            console.error('Error initializing keypairs:', error);
            throw error;
        }
    }

    /**
     * Creates a new SPL Token
     * @param {number} decimals - Number of decimals for the token (default: 6)
     */
    async createToken(decimals = 6) {
        try {
            if (!this.tokenAuthorityKeypair) {
                throw new Error('Token Authority keypair not initialized');
            }

            // Create mint account
            const mintAccount = Keypair.generate();
            console.log('Creating token with mint address:', mintAccount.publicKey.toString());

            const mintRent = await this.connection.getMinimumBalanceForRentExemption(82);

            // Create transaction
            const transaction = new Transaction();
            
            // Add create account instruction
            transaction.add(
                SystemProgram.createAccount({
                    fromPubkey: this.tokenAuthorityKeypair.publicKey,
                    newAccountPubkey: mintAccount.publicKey,
                    lamports: mintRent,
                    space: 82,
                    programId: this.programId
                })
            );

            // Add initialize mint instruction
            transaction.add(
                createInitializeMintInstruction(
                    mintAccount.publicKey,
                    decimals,
                    this.mintAuthorityKeypair.publicKey,
                    null,
                    this.programId
                )
            );

            // Send transaction
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.tokenAuthorityKeypair, mintAccount]
            );

            console.log('Token created successfully!');
            console.log('Signature:', signature);
            
            // Save token info to config
            this.config.token = {
                mintAddress: mintAccount.publicKey.toString(),
                decimals: decimals,
                mintAuthority: this.mintAuthorityKeypair.publicKey.toString()
            };
            fs.writeFileSync('./config.json', JSON.stringify(this.config, null, 4));

            return mintAccount.publicKey;
        } catch (error) {
            console.error('Error creating token:', error);
            throw error;
        }
    }

    /**
     * Creates a token account for a wallet
     * @param {PublicKey} owner - Public key of the account owner
     * @param {PublicKey} mint - Mint address of the token
     */
    async createTokenAccount(owner, mint) {
        try {
            if (!this.tokenAuthorityKeypair) {
                throw new Error('Token Authority keypair not initialized');
            }

            const ownerPubkey = new PublicKey(owner);
            const mintPubkey = new PublicKey(mint);
            
            const associatedTokenAddress = await getAssociatedTokenAddress(
                mintPubkey,
                ownerPubkey,
                false,
                this.programId
            );

            const transaction = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    this.tokenAuthorityKeypair.publicKey,
                    associatedTokenAddress,
                    ownerPubkey,
                    mintPubkey,
                    this.programId
                )
            );

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.tokenAuthorityKeypair]
            );

            console.log('Token account created:', associatedTokenAddress.toString());
            return associatedTokenAddress;
        } catch (error) {
            console.error('Error creating token account:', error);
            throw error;
        }
    }

    /**
     * Mints tokens to a specified account
     * @param {PublicKey} mint - Mint address
     * @param {PublicKey} destination - Destination token account
     * @param {number} amount - Amount to mint
     */
    async mintToken(mint, destination, amount) {
        try {
            if (!this.mintAuthorityKeypair) {
                throw new Error('Mint Authority keypair not initialized');
            }

            const transaction = new Transaction().add(
                createMintToInstruction(
                    new PublicKey(mint),
                    new PublicKey(destination),
                    this.mintAuthorityKeypair.publicKey,
                    amount
                )
            );

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.mintAuthorityKeypair]
            );

            console.log('Tokens minted successfully!');
            return signature;
        } catch (error) {
            console.error('Error minting tokens:', error);
            throw error;
        }
    }

    /**
     * Transfers tokens between accounts
     * @param {PublicKey} source - Source token account
     * @param {PublicKey} destination - Destination token account
     * @param {number} amount - Amount to transfer
     */
    async transferTokens(source, destination, amount) {
        try {
            if (!this.treasuryKeypair) {
                throw new Error('Treasury keypair not initialized');
            }

            const transaction = new Transaction().add(
                createTransferInstruction(
                    new PublicKey(source),
                    new PublicKey(destination),
                    this.treasuryKeypair.publicKey,
                    amount
                )
            );

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.treasuryKeypair]
            );

            console.log('Tokens transferred successfully!');
            return signature;
        } catch (error) {
            console.error('Error transferring tokens:', error);
            throw error;
        }
    }

    /**
     * Gets the balance of a token account
     * @param {string} tokenAccount - Token account address
     */
    async getTokenBalance(tokenAccount) {
        try {
            const accountInfo = await this.connection.getTokenAccountBalance(
                new PublicKey(tokenAccount)
            );
            return accountInfo.value.uiAmount;
        } catch (error) {
            console.error('Error getting token balance:', error);
            throw error;
        }
    }
}

module.exports = TokenManager; 