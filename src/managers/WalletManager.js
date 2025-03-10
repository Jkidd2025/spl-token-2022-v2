const { 
    Connection, 
    PublicKey,
    LAMPORTS_PER_SOL
} = require('@solana/web3.js');

class WalletManager {
    constructor(connection, config) {
        this.connection = connection;
        this.config = config;
    }

    async checkBalance(publicKey) {
        try {
            const balance = await this.connection.getBalance(new PublicKey(publicKey));
            return balance / LAMPORTS_PER_SOL;
        } catch (error) {
            console.error(`Error checking balance for ${publicKey}:`, error.message);
            return null;
        }
    }

    async requestAirdrop(publicKey, amount) {
        try {
            const signature = await this.connection.requestAirdrop(
                new PublicKey(publicKey),
                amount * LAMPORTS_PER_SOL
            );
            await this.connection.confirmTransaction(signature);
            console.log(`Airdropped ${amount} SOL to ${publicKey}`);
            console.log('Transaction signature:', signature);
            return true;
        } catch (error) {
            console.error('Error requesting airdrop:', error.message);
            return false;
        }
    }

    async displayWalletInfo(role, publicKey) {
        console.log(`\n${role} Wallet Details:`);
        console.log('Public Key:', publicKey);
        const balance = await this.checkBalance(publicKey);
        if (balance !== null) {
            console.log('Balance:', balance, 'SOL');
            try {
                const accountInfo = await this.connection.getAccountInfo(new PublicKey(publicKey));
                console.log('Account Owner:', accountInfo?.owner?.toBase58());
            } catch (error) {
                console.error('Error fetching account info:', error.message);
            }
        }
    }

    async checkAllWallets() {
        console.log('\n=== Wallet Balance Summary ===');
        console.log('-----------------------------');
        
        const wallets = {
            'Token Authority': this.config.wallets.tokenAuthority.publicKey,
            'Mint Authority': this.config.wallets.mintAuthority.publicKey,
            'Treasury': this.config.wallets.treasury.publicKey
        };

        for (const [role, publicKey] of Object.entries(wallets)) {
            if (!publicKey || publicKey === 'YOUR_MINT_AUTHORITY_PUBLIC_KEY' || 
                publicKey === 'YOUR_TREASURY_PUBLIC_KEY') {
                console.log(`${role}:`);
                console.log('  Address: Not configured');
                console.log('  Balance: N/A');
                console.log('-----------------------------');
                continue;
            }
            
            const balance = await this.checkBalance(publicKey);
            console.log(`${role}:`);
            console.log(`  Address: ${publicKey}`);
            console.log(`  Balance: ${balance !== null ? balance + ' SOL' : 'Error checking balance'}`);
            console.log('-----------------------------');
        }
    }

    async fundWallets(amount) {
        const wallets = [
            { role: 'Token Authority', address: this.config.wallets.tokenAuthority.publicKey },
            { role: 'Mint Authority', address: this.config.wallets.mintAuthority.publicKey },
            { role: 'Treasury', address: this.config.wallets.treasury.publicKey }
        ];

        console.log('\n=== Funding Wallets with Airdrops ===');
        for (const wallet of wallets) {
            if (!wallet.address || wallet.address.startsWith('YOUR_')) {
                console.log(`\nSkipping ${wallet.role} - not configured`);
                continue;
            }
            
            console.log(`\nRequesting ${amount} SOL airdrop for ${wallet.role}...`);
            await this.requestAirdrop(wallet.address, amount);
            // Wait a bit between airdrops to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

module.exports = WalletManager; 