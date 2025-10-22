# Pygo: Pay PYUSD/ETH Over SMS 

Pygo allows users to send and receive ETH and PYUSD on Ethereum Sepolia via basic SMS on feature phones with no internet access.

## 🔧 Core Idea

Pygo bridges the gap between blockchain and traditional feature phones by enabling:

- A backend wallet system that users interact with via SMS commands
- A trusted SMS gateway (Twilio) to send/receive messages
- Custodial wallets managed by our backend on Ethereum Sepolia

## 📱 How It Works

### User Registration
```
User sends: REGISTER <PIN>
Response: "Wallet created. Balance: 0.0000 ETH, 0.00 PYUSD. Your PIN is used to confirm transactions."
```

### Checking Balance
```
User sends: BALANCE <PIN>
Response: "Pygo Balance: ETH: 0.0000, PYUSD: 0.00"
```

### Sending Money
```
User sends: SEND +448927779812 10 PYUSD <PIN>
Response: "Confirm sending 10 PYUSD to +448927779812? Reply with YES to confirm or NO to cancel."
User sends: YES
Response: "Sent 10 PYUSD to +448927779812. New PYUSD balance: 5.00"
```

### Receiving Money
The recipient gets a notification when money is sent to their phone number:
```
"You received 10 PYUSD from +123456789. New PYUSD balance: 10.00"
```

### Price Lookup
```
User sends: PRICE ETHUSD
Response: "Price ETHUSD: <value>"
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB
- Twilio account
- ETH on Sepolia for gas (fund master wallet)

### Installation

1. Go to pygo backend
```
cd pygo/pygo
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file in the `pygo/pygo` directory with the following variables:
```
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/pygo

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Ethereum Sepolia
ETH_RPC_URL=https://sepolia.gateway.tenderly.co
ETH_CHAIN_ID=11155111
ETH_MASTER_WALLET_PK=your_master_wallet_private_key

# Encryption Key for storing user wallet keys
ENCRYPTION_KEY=your_strong_encryption_key_32_chars

# Supported Tokens (comma-separated)
SUPPORTED_TOKENS=ETH,PYUSD

# Token Addresses (Sepolia)
PYUSD_ADDRESS=your_pyusd_sepolia_address
PYUSD_DECIMALS=6

# Pyth Hermes
PYTH_HERMES_HTTP=https://hermes.pyth.network

# JWT Secret for API authentication (if needed later)
JWT_SECRET=your_jwt_secret_key_for_admin_api
```

4. Start the server

```bash
npm run dev
```

5. Set up Twilio webhook
Configure your Twilio phone number to send webhook POST requests to:
```
https://your-server.com/sms/webhook
```

## 💬 SMS Commands

- `REGISTER <PIN>` - Create a new wallet
- `BALANCE <PIN>` - Check your balance
- `SEND <RECIPIENT> <AMOUNT> <TOKEN> <PIN>` - Send tokens
  - Example: `SEND +1234567890 10 PYUSD 1234`
- `PRICE [SYMBOL]` - Get price via Pyth Hermes (e.g., `PRICE ETHUSD`, `PRICE BTCUSD`)
- `HELP` - Get list of available commands

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Blockchain**: Ethereum (Sepolia), ERC-20 (PYUSD), ethers.js
- **SMS Gateway**: Twilio
- **Security**: AES encryption for wallet keys

## 🔒 Security Notes

- User wallet private keys are encrypted at rest
- PINs are hashed before storage
- Account locking after 5 failed PIN attempts
- Transaction confirmations required before execution

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

