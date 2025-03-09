const { 
    Connection, 
    Keypair, 
    PublicKey, 
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction
} = require('@solana/web3.js');
const { 
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    createInitializeTransferFeeConfigInstruction,
    createInitializeMetadataPointerInstruction,
    ExtensionType,
    getMintLen,
    getAccountLen
} = require('@solana/spl-token');
const { 
    Metadata,
    DataV2
} = require('@metaplex-foundation/mpl-token-metadata');
const fs = require('fs');

class TokenManager {
    constructor(connection, config) {
        this.connection = connection;
        this.config = config;
        this.programId = TOKEN_2022_PROGRAM_ID;
        
        /**
         * Default transfer fee configuration that will be used if no custom config is provided
         * This configuration will charge a 5% fee on all token transfers
         * 
         * feeBasisPoints: The fee percentage in basis points (100 basis points = 1%)
         *                 500 basis points = 5%
         * 
         * maxFee: The maximum fee that can be charged per transfer
         *         BigInt(0) means no maximum - the percentage fee will always apply
         */
        this.defaultTransferFeeConfig = {
            feeBasisPoints: 500, // 5% (500 basis points = 5%)
            maxFee: BigInt(0) // No maximum fee cap - will always charge 5%
        };
    }

    /**
     * Creates a new Token-2022 token with transfer fee capability
     * @param {string} mintAuthorityPubkey - Public key of the mint authority
     * @param {string} freezeAuthorityPubkey - Public key of the freeze authority
     * @param {number} decimals - Number of decimals for the token (default: 6)
     * @param {Object} transferFeeConfig - Optional custom transfer fee configuration
     *                                    If not provided, default 5% fee will be used
     * @returns {PublicKey} The public key of the new token's mint account
     */
    async createToken(
        mintAuthorityPubkey,
        freezeAuthorityPubkey,
        decimals = 6,
        transferFeeConfig = null
    ) {
        try {
            // Create mint account
            const mintAccount = Keypair.generate();
            console.log('Creating Token-2022 token with mint address:', mintAccount.publicKey.toString());

            // Calculate space for the mint account including extensions
            // We always include MetadataPointer and TransferFeeConfig extensions
            const extensions = [ExtensionType.MetadataPointer, ExtensionType.TransferFeeConfig];
            
            const mintLen = getMintLen(extensions);
            const mintRent = await this.connection.getMinimumBalanceForRentExemption(mintLen);

            // Create transaction
            const transaction = new Transaction();
            
            // Add create account instruction
            transaction.add(
                SystemProgram.createAccount({
                    fromPubkey: new PublicKey(this.config.wallets.tokenAuthority.publicKey),
                    newAccountPubkey: mintAccount.publicKey,
                    lamports: mintRent,
                    space: mintLen,
                    programId: this.programId
                })
            );

            // Add initialize mint instruction
            transaction.add(
                createInitializeMintInstruction(
                    mintAccount.publicKey,
                    decimals,
                    new PublicKey(mintAuthorityPubkey),
                    freezeAuthorityPubkey ? new PublicKey(freezeAuthorityPubkey) : null,
                    this.programId
                )
            );

            /**
             * Configure the transfer fee:
             * 1. If transferFeeConfig is provided, use that (custom configuration)
             * 2. If not provided, use the default configuration (5% fee)
             * 
             * The fee configuration requires:
             * - authority: Who can modify the fee settings
             * - withdrawWithheldAuthority: Who can withdraw collected fees
             * - feeBasisPoints: The fee percentage (in basis points)
             * - maxFee: Maximum fee per transfer (0 for no maximum)
             */
            const feeConfig = transferFeeConfig || {
                ...this.defaultTransferFeeConfig,
                authority: new PublicKey(this.config.wallets.feeCollector.publicKey),
                withdrawWithheldAuthority: new PublicKey(this.config.wallets.feeCollector.publicKey)
            };

            // Add transfer fee configuration to the token
            transaction.add(
                createInitializeTransferFeeConfigInstruction(
                    mintAccount.publicKey,
                    feeConfig.authority,
                    feeConfig.withdrawWithheldAuthority,
                    feeConfig.feeBasisPoints,
                    feeConfig.maxFee,
                    this.programId
                )
            );

            // Send transaction
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [mintAccount]
            );

            console.log('Token-2022 token created successfully with transfer fee configuration!');
            console.log('Signature:', signature);
            
            // Save token info to config file
            this.config.token = {
                mintAddress: mintAccount.publicKey.toString(),
                decimals: decimals,
                mintAuthority: mintAuthorityPubkey,
                freezeAuthority: freezeAuthorityPubkey || null,
                programId: this.programId.toString(),
                extensions: extensions,
                transferFee: {
                    feeBasisPoints: feeConfig.feeBasisPoints,
                    maxFee: feeConfig.maxFee.toString()
                }
            };
            fs.writeFileSync('./config.json', JSON.stringify(this.config, null, 4));

            return mintAccount.publicKey;
        } catch (error) {
            console.error('Error creating Token-2022 token:', error);
            throw error;
        }
    }

    async createTokenAccount(owner, mint) {
        try {
            // Generate a new account
            const tokenAccount = Keypair.generate();
            console.log('Creating token account:', tokenAccount.publicKey.toString());

            // Get the minimum balance for rent exemption
            const accountRent = await this.connection.getMinimumBalanceForRentExemption(
                getAccountLen(this.programId)
            );

            // Create transaction
            const transaction = new Transaction();

            // Add create account instruction
            transaction.add(
                SystemProgram.createAccount({
                    fromPubkey: new PublicKey(owner),
                    newAccountPubkey: tokenAccount.publicKey,
                    lamports: accountRent,
                    space: getAccountLen(this.programId),
                    programId: this.programId
                })
            );

            // Add initialize account instruction
            transaction.add(
                createInitializeMetadataPointerInstruction(
                    this.programId,
                    tokenAccount.publicKey,
                    new PublicKey(mint),
                    new PublicKey(owner)
                )
            );

            // Send transaction
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [tokenAccount]
            );

            console.log('Token account created successfully!');
            console.log('Signature:', signature);

            return tokenAccount.publicKey;
        } catch (error) {
            console.error('Error creating token account:', error);
            throw error;
        }
    }

    async mintToken(
        mintPubkey,
        destinationPubkey,
        mintAuthorityPubkey,
        amount
    ) {
        try {
            const mintPublicKey = new PublicKey(mintPubkey);
            const destinationPublicKey = new PublicKey(destinationPubkey);
            const mintAuthorityPublicKey = new PublicKey(mintAuthorityPubkey);

            // Create transaction
            const transaction = new Transaction();

            // Add mint instruction
            transaction.add(
                createInitializeMetadataPointerInstruction(
                    this.programId,
                    mintPublicKey,
                    destinationPublicKey,
                    mintAuthorityPublicKey,
                    amount
                )
            );

            // Send transaction
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                []
            );

            console.log('Tokens minted successfully!');
            console.log('Signature:', signature);

            return signature;
        } catch (error) {
            console.error('Error minting tokens:', error);
            throw error;
        }
    }

    async getTokenBalance(tokenAccountPubkey) {
        try {
            const accountInfo = await this.connection.getTokenAccountBalance(
                new PublicKey(tokenAccountPubkey)
            );
            return accountInfo.value.uiAmount;
        } catch (error) {
            console.error('Error getting token balance:', error);
            throw error;
        }
    }

    async transferTokens(
        sourceTokenAccount,
        destinationTokenAccount,
        ownerPubkey,
        amount
    ) {
        try {
            const sourcePublicKey = new PublicKey(sourceTokenAccount);
            const destinationPublicKey = new PublicKey(destinationTokenAccount);
            const ownerPublicKey = new PublicKey(ownerPubkey);

            // Create transaction
            const transaction = new Transaction();

            // Add transfer instruction
            transaction.add(
                createInitializeMetadataPointerInstruction(
                    this.programId,
                    sourcePublicKey,
                    destinationPublicKey,
                    ownerPublicKey,
                    amount
                )
            );

            // Send transaction
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                []
            );

            console.log('Tokens transferred successfully!');
            console.log('Signature:', signature);
            return signature;
        } catch (error) {
            console.error('Error transferring tokens:', error);
            throw error;
        }
    }

    async freezeAccount(
        tokenAccount,
        mintPubkey,
        freezeAuthorityPubkey
    ) {
        try {
            const tokenAccountPublicKey = new PublicKey(tokenAccount);
            const mintPublicKey = new PublicKey(mintPubkey);
            const freezeAuthorityPublicKey = new PublicKey(freezeAuthorityPubkey);

            // Create transaction
            const transaction = new Transaction();

            // Add freeze instruction
            transaction.add(
                createInitializeMetadataPointerInstruction(
                    this.programId,
                    tokenAccountPublicKey,
                    mintPublicKey,
                    freezeAuthorityPublicKey,
                    []
                )
            );

            // Send transaction
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                []
            );

            console.log('Account frozen successfully!');
            console.log('Signature:', signature);
            return signature;
        } catch (error) {
            console.error('Error freezing account:', error);
            throw error;
        }
    }

    async thawAccount(
        tokenAccount,
        mintPubkey,
        freezeAuthorityPubkey
    ) {
        try {
            const tokenAccountPublicKey = new PublicKey(tokenAccount);
            const mintPublicKey = new PublicKey(mintPubkey);
            const freezeAuthorityPublicKey = new PublicKey(freezeAuthorityPubkey);

            // Create transaction
            const transaction = new Transaction();

            // Add thaw instruction
            transaction.add(
                createInitializeMetadataPointerInstruction(
                    this.programId,
                    tokenAccountPublicKey,
                    mintPublicKey,
                    freezeAuthorityPublicKey,
                    []
                )
            );

            // Send transaction
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                []
            );

            console.log('Account thawed successfully!');
            console.log('Signature:', signature);
            return signature;
        } catch (error) {
            console.error('Error thawing account:', error);
            throw error;
        }
    }

    async burnTokens(
        tokenAccount,
        mintPubkey,
        ownerPubkey,
        amount
    ) {
        try {
            const tokenAccountPublicKey = new PublicKey(tokenAccount);
            const mintPublicKey = new PublicKey(mintPubkey);
            const ownerPublicKey = new PublicKey(ownerPubkey);

            // Create transaction
            const transaction = new Transaction();

            // Add burn instruction
            transaction.add(
                createInitializeMetadataPointerInstruction(
                    this.programId,
                    tokenAccountPublicKey,
                    mintPublicKey,
                    ownerPublicKey,
                    amount
                )
            );

            // Send transaction
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                []
            );

            console.log('Tokens burned successfully!');
            console.log('Signature:', signature);
            return signature;
        } catch (error) {
            console.error('Error burning tokens:', error);
            throw error;
        }
    }

    async getTokenAccountInfo(tokenAccountPubkey) {
        try {
            const accountInfo = await this.connection.getAccountInfo(
                new PublicKey(tokenAccountPubkey)
            );
            
            const tokenAccountInfo = getAccountLen(this.programId)(accountInfo.data);
            
            return {
                mint: new PublicKey(tokenAccountInfo.mint).toString(),
                owner: new PublicKey(tokenAccountInfo.owner).toString(),
                amount: tokenAccountInfo.amount,
                delegate: new PublicKey(tokenAccountInfo.delegate).toString(),
                state: tokenAccountInfo.state,
                isNative: tokenAccountInfo.isNative,
                delegatedAmount: tokenAccountInfo.delegatedAmount,
                closeAuthority: new PublicKey(tokenAccountInfo.closeAuthority).toString()
            };
        } catch (error) {
            console.error('Error getting token account info:', error);
            throw error;
        }
    }

    async getMintInfo(mintPubkey) {
        try {
            const accountInfo = await this.connection.getAccountInfo(
                new PublicKey(mintPubkey)
            );
            
            const mintInfo = getMintLen(this.programId)(accountInfo.data);
            
            return {
                mintAuthority: new PublicKey(mintInfo.mintAuthority).toString(),
                supply: mintInfo.supply,
                decimals: mintInfo.decimals,
                isInitialized: mintInfo.isInitialized,
                freezeAuthority: new PublicKey(mintInfo.freezeAuthority).toString()
            };
        } catch (error) {
            console.error('Error getting mint info:', error);
            throw error;
        }
    }

    async createTokenWithMetadata(
        name,
        symbol,
        uri,
        mintAuthorityPubkey,
        freezeAuthorityPubkey,
        decimals = 6
    ) {
        try {
            // Create mint account
            const mintAccount = Keypair.generate();
            console.log('Creating token with mint address:', mintAccount.publicKey.toString());

            // Get the minimum balance for rent exemption
            const mintRent = await this.connection.getMinimumBalanceForRentExemption(
                getMintLen([ExtensionType.MetadataPointer])
            );

            // Create transaction for token creation
            const transaction = new Transaction();
            
            // Add create account instruction
            transaction.add(
                SystemProgram.createAccount({
                    fromPubkey: new PublicKey(this.config.wallets.tokenAuthority.publicKey),
                    newAccountPubkey: mintAccount.publicKey,
                    lamports: mintRent,
                    space: getMintLen([ExtensionType.MetadataPointer]),
                    programId: this.programId
                })
            );

            // Add initialize mint instruction
            transaction.add(
                createInitializeMintInstruction(
                    mintAccount.publicKey,
                    decimals,
                    new PublicKey(mintAuthorityPubkey),
                    freezeAuthorityPubkey ? new PublicKey(freezeAuthorityPubkey) : null,
                    this.programId
                )
            );

            // Create metadata
            const metadataData = {
                name: name,
                symbol: symbol,
                uri: uri,
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null
            };

            const metadataAccount = await Metadata.getPDA(mintAccount.publicKey);
            
            const createMetadataInstruction = createCreateMetadataAccountV2Instruction(
                {
                    metadata: metadataAccount,
                    mint: mintAccount.publicKey,
                    mintAuthority: new PublicKey(mintAuthorityPubkey),
                    payer: new PublicKey(this.config.wallets.tokenAuthority.publicKey),
                    updateAuthority: new PublicKey(mintAuthorityPubkey),
                },
                {
                    createMetadataAccountArgsV2: {
                        data: metadataData,
                        isMutable: true,
                        collectionDetails: null
                    }
                }
            );

            transaction.add(createMetadataInstruction);

            // Send transaction
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [mintAccount]
            );

            console.log('Token created successfully with metadata!');
            console.log('Signature:', signature);
            
            // Save token info to config
            this.config.token = {
                mintAddress: mintAccount.publicKey.toString(),
                decimals: decimals,
                mintAuthority: mintAuthorityPubkey,
                freezeAuthority: freezeAuthorityPubkey || null,
                metadata: {
                    name: name,
                    symbol: symbol,
                    uri: uri
                },
                programId: this.programId.toString(),
                extensions: [ExtensionType.MetadataPointer]
            };
            fs.writeFileSync('./config.json', JSON.stringify(this.config, null, 4));

            return mintAccount.publicKey;
        } catch (error) {
            console.error('Error creating token with metadata:', error);
            throw error;
        }
    }

    async updateTokenMetadata(
        mintPubkey,
        name,
        symbol,
        uri,
        updateAuthorityPubkey
    ) {
        try {
            const metadataAccount = await Metadata.getPDA(new PublicKey(mintPubkey));
            
            const updateMetadataInstruction = createUpdateMetadataAccountV2Instruction(
                {
                    metadata: metadataAccount,
                    updateAuthority: new PublicKey(updateAuthorityPubkey),
                },
                {
                    updateMetadataAccountArgsV2: {
                        data: {
                            name,
                            symbol,
                            uri,
                            sellerFeeBasisPoints: 0,
                            creators: null,
                            collection: null,
                            uses: null
                        },
                        isMutable: true,
                        updateAuthority: new PublicKey(updateAuthorityPubkey),
                        primarySaleHappened: false
                    }
                }
            );

            const transaction = new Transaction().add(updateMetadataInstruction);

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                []
            );

            console.log('Token metadata updated successfully!');
            console.log('Signature:', signature);

            // Update config
            if (this.config.token && this.config.token.mintAddress === mintPubkey) {
                this.config.token.metadata = {
                    name,
                    symbol,
                    uri
                };
                fs.writeFileSync('./config.json', JSON.stringify(this.config, null, 4));
            }

            return signature;
        } catch (error) {
            console.error('Error updating token metadata:', error);
            throw error;
        }
    }

    async getTokenMetadata(mintPubkey) {
        try {
            const metadataAccount = await Metadata.getPDA(new PublicKey(mintPubkey));
            const metadata = await Metadata.load(this.connection, metadataAccount);
            return metadata.data;
        } catch (error) {
            console.error('Error getting token metadata:', error);
            throw error;
        }
    }
}

module.exports = TokenManager; 