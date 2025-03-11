# SPL Token 2022 v2

This repository contains the implementation of the Stealth Mode Startup ($SMS) token on Solana's devnet using SPL Token 2022 standard.

## Token Details

- **Name**: Stealth Mode Startup
- **Symbol**: SMS
- **Total Supply**: 1,000,000,000 (1 billion) tokens
- **Decimals**: 6
- **Token Mint Address**: `6ABBo9Y2nVtXuhVmnWmkrLMtfrvxuHJngQGLfeyXk1d8`
- **Metadata Account**: `E3WnVs4fidMVAin47u6i1eTvm6d81SNvoDrVHxACHtAX`

## Security Features

### Immutable Supply

- Mint authority has been permanently disabled
- Transaction signature: `87e16fa` (mint creation and initial supply)
- No additional tokens can be minted

### Immutable Metadata

- Metadata update authority has been permanently disabled
- Transaction signature: `4C2xjE9P5uszvrgVTuLhPoR9qzGtE6hVrABtuhy6NmqxdArwbZsH64wNUgCMvxcm3nfLePJr35MeUPqt5CQ22Du`
- Token metadata (name, symbol, URI) cannot be modified

## Testing Confirmations

### Token Creation and Supply

- ✅ Successfully created token mint
- ✅ Minted initial supply of 1 billion tokens
- ✅ Verified token metadata on-chain
- ✅ Confirmed token appears on Solscan (devnet)

### Transfer Testing

- ✅ Created test wallet: `5GL8Ffo7dDmqKjiDZFWkUvxqB141ezcaRnX3QnwAq4XF`
- ✅ Successfully transferred 1,000 tokens to test wallet
- ✅ Transaction signature: `4jfBoVFoJRwqnghLniaFGKqJogWWFampUkfVQQJiQ3f6hwzXMrkqEXi4hNSNstk6MbZyjqekBocKKXb1pHsryRvM`
- ✅ Verified balances after transfer:
  - Treasury: 999,999,000 SMS
  - Test Wallet: 1,000 SMS

### Security Testing

- ✅ Confirmed mint authority is disabled
- ✅ Confirmed metadata is immutable
- ✅ Verified token supply cannot be increased
- ✅ Verified metadata cannot be modified

## Repository Structure

```
.
├── assets/
│   ├── logo.png
│   └── metadata.json
├── wallets/
│   ├── token-authority.json
│   ├── mint-authority.json
│   └── treasury.json
├── create_token.js
├── transfer_tokens.js
├── disable_minting.js
└── disable_metadata_updates.js
```

## Scripts

- `create_token.js`: Creates the token mint and initial supply
- `transfer_tokens.js`: Handles token transfers between accounts
- `disable_minting.js`: Disables the mint authority
- `disable_metadata_updates.js`: Makes token metadata immutable

## Verification Links

- Token on Solscan: [View on Devnet](https://solscan.io/token/6ABBo9Y2nVtXuhVmnWmkrLMtfrvxuHJngQGLfeyXk1d8?cluster=devnet)
- Metadata: [View JSON](https://raw.githubusercontent.com/Jkidd2025/spl-token-2022-v2/main/assets/metadata.json)

## Dependencies

```json
{
  "@solana/spl-token": "latest",
  "@solana/web3.js": "latest",
  "@metaplex-foundation/mpl-token-metadata": "latest"
}
```

## Features

### Core Token Operations

- Create new SPL tokens
- Create token accounts
- Mint tokens
- Transfer tokens
- Check token balances

### Wallet Management

- Token Authority: Creates and manages token setup
- Mint Authority: Controls token minting
- Treasury: Manages token distribution

## Project Structure

```
/
├── src/
│   ├── managers/
│   │   ├── TokenManager.js    # Token operations
│   │   └── WalletManager.js   # Wallet management
├── wallets/                   # Wallet keypair files
├── index.js                   # Main program
├── config.json                # Configuration
├── .env                       # Private keys (not committed)
└── README.md
```

## Prerequisites

- Node.js v14+ and npm
- Solana Tool Suite
- Solana devnet account with SOL

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Jkidd2025/spl-token-2022-v2.git
cd spl-token-2022-v2
```

2. Install dependencies:

```bash
npm install
```

## Configuration

1. Create wallet keypairs:

```bash
solana-keygen new --outfile wallets/token-authority.json
solana-keygen new --outfile wallets/mint-authority.json
solana-keygen new --outfile wallets/treasury.json
```

2. Set up environment variables in `.env`:

```
TOKEN_AUTHORITY_PRIVATE_KEY="[...]"
MINT_AUTHORITY_PRIVATE_KEY="[...]"
TREASURY_PRIVATE_KEY="[...]"
```

3. Update `config.json` with wallet public keys:

```json
{
  "network": {
    "endpoint": "https://api.devnet.solana.com"
  },
  "wallets": {
    "tokenAuthority": {
      "publicKey": "YOUR_TOKEN_AUTHORITY_PUBLIC_KEY"
    },
    "mintAuthority": {
      "publicKey": "YOUR_MINT_AUTHORITY_PUBLIC_KEY"
    },
    "treasury": {
      "publicKey": "YOUR_TREASURY_PUBLIC_KEY"
    }
  }
}
```

## Wallet Requirements

Each wallet needs SOL on devnet to perform operations:

- Token Authority: ~2 SOL (token creation, account creation)
- Mint Authority: ~1 SOL (minting operations)
- Treasury: ~1 SOL (transfer operations)

Get SOL from:

1. Solana Devnet Faucet: https://faucet.solana.com/
2. CLI: `solana airdrop 2 <WALLET_ADDRESS> --url devnet`

## Usage

Run the program:

```bash
node index.js
```

The program will:

1. Check wallet balances
2. Create a new token
3. Create token accounts
4. Mint initial supply
5. Perform a test transfer
6. Display token information

## Security Notes

- Keep your private keys secure
- Never commit the `.env` file
- Use separate wallets for different responsibilities
- Always test on devnet first

## Development

To modify the program:

1. Update wallet configurations in `config.json`
2. Modify token parameters in `index.js`
3. Add new functionality in the manager classes

## Error Handling

Common issues and solutions:

- "Rate limit reached" - Wait for faucet limits to reset
- "Insufficient funds" - Ensure wallets have enough SOL
- "Account not found" - Verify wallet addresses

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Mainnet Deployment

### Prerequisites

1. **Mainnet SOL**

   - Minimum 2 SOL recommended for deployment
   - Split across deployment wallets:
     - Token Authority: ~1 SOL
     - Mint Authority: ~0.5 SOL
     - Treasury: ~0.5 SOL

2. **Secure Environment**

   - Clean development machine
   - Secure network connection
   - Up-to-date software

3. **Wallet Security**
   - Fresh wallet keypairs
   - Hardware wallet for Treasury (recommended)
   - Backup of all keypairs

### Deployment Steps

1. **Preparation**

   ```bash
   # Create new mainnet wallets
   solana-keygen new --outfile wallets/mainnet/token-authority.json
   solana-keygen new --outfile wallets/mainnet/mint-authority.json
   solana-keygen new --outfile wallets/mainnet/treasury.json

   # Fund wallets with SOL
   # Verify configuration
   node deploy_mainnet.js
   ```

2. **Token Creation**

   ```bash
   # Create and mint token
   node create_token.js --mainnet

   # Verify token on Solscan
   # Save token address
   ```

3. **Security Measures**

   ```bash
   # Disable minting
   node disable_minting.js --mainnet

   # Disable metadata updates
   node disable_metadata_updates.js --mainnet
   ```

4. **Verification**
   - Confirm token on Solscan
   - Verify metadata
   - Test token transfers
   - Confirm authorities are disabled

### Security Checklist

- [ ] Fresh wallets created
- [ ] Sufficient SOL in wallets
- [ ] Metadata URI is permanent
- [ ] Token parameters verified
- [ ] Mint authority disabled
- [ ] Metadata authority disabled
- [ ] Transfer functionality tested
- [ ] All transactions confirmed

### Post-Deployment

1. **Backup**

   - Save all transaction signatures
   - Backup wallet files
   - Document token addresses

2. **Cleanup**
   - Secure or delete deployment wallets
   - Clear environment variables
   - Remove sensitive files
