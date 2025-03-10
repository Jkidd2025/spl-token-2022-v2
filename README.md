# SPL Token Program

A simplified Solana Program Library (SPL) Token implementation focusing on core token functionality.

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
