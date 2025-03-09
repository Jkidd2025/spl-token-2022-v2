# SPL Token 2022 v2

A Solana Program Library (SPL) Token implementation using the Token-2022 program, featuring transfer fees, metadata, and advanced token management capabilities.

## Features

- **Token-2022 Program Integration**: Uses the latest SPL Token standard
- **Transfer Fee System**: Configurable transfer fees (default 5%)
- **Token Metadata**: Full metadata support with update capability
- **Account Management**: Treasury and Fee Collector account handling
- **Token Operations**:
  - Token creation with metadata
  - Token minting
  - Transfer with fee collection
  - Account freezing/thawing
  - Token burning
  - Balance checking

## Prerequisites

- Node.js v14+ and npm
- Solana Tool Suite
- Solana devnet account with SOL

## Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/spl-token-2022-v2.git

# Navigate to project directory
cd spl-token-2022-v2

# Install dependencies
npm install
```

## Configuration

1. Create a `config.json` file with your wallet configurations:

```json
{
  "network": {
    "endpoint": "https://api.devnet.solana.com",
    "wsEndpoint": "wss://api.devnet.solana.com/"
  },
  "wallets": {
    "tokenAuthority": {
      "publicKey": "YOUR_TOKEN_AUTHORITY_PUBLIC_KEY"
    },
    "mintAuthority": {
      "publicKey": "YOUR_MINT_AUTHORITY_PUBLIC_KEY"
    },
    "freezeAuthority": {
      "publicKey": "YOUR_FREEZE_AUTHORITY_PUBLIC_KEY"
    },
    "feeCollector": {
      "publicKey": "YOUR_FEE_COLLECTOR_PUBLIC_KEY"
    },
    "treasury": {
      "publicKey": "YOUR_TREASURY_PUBLIC_KEY"
    }
  }
}
```

2. Update `metadata.json` with your token's metadata:

```json
{
  "name": "Your Token Name",
  "symbol": "SYMBOL",
  "description": "Your token description",
  "attributes": [
    {
      "trait_type": "Token Type",
      "value": "Utility"
    }
  ]
}
```

## Usage

```bash
# Run the program
node index.js
```

## Project Structure

```
├── src/
│   ├── managers/
│   │   ├── TokenManager.js    # Token operations
│   │   └── WalletManager.js   # Wallet management
│   └── utils/
├── index.js                   # Main program
├── config.json                # Configuration
├── metadata.json              # Token metadata
└── README.md
```

## Token Features

### Transfer Fee

- Default fee: 5% of transfer amount
- Configurable fee percentage
- No maximum fee cap
- Fees collected in dedicated fee collector account

### Metadata Support

- Token name
- Symbol
- URI
- Custom attributes
- Updateable fields

## Development

To modify the transfer fee percentage or add custom configurations:

```javascript
const customFeeConfig = {
  authority: config.wallets.feeCollector.publicKey,
  withdrawWithheldAuthority: config.wallets.feeCollector.publicKey,
  feeBasisPoints: 300, // 3% instead of default 5%
  maxFee: BigInt(0),
};
```

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
