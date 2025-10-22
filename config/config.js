require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pygo',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  ethereum: {
    rpcUrl: process.env.ETH_RPC_URL || 'https://sepolia.gateway.tenderly.co',
    chainId: Number(process.env.ETH_CHAIN_ID || 11155111),
    masterWalletPrivateKey: process.env.ETH_MASTER_WALLET_PK,
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },
  supportedTokens: {
    list: (process.env.SUPPORTED_TOKENS || 'ETH,PYUSD').split(','),
    erc20: {
      PYUSD: process.env.PYUSD_ADDRESS || '0x0000000000000000000000000000000000000000',
    },
    native: ['ETH'],
    decimals: {
      ETH: 18,
      PYUSD: Number(process.env.PYUSD_DECIMALS || 6),
    },
  },
  pyth: {
    hermesHttp: process.env.PYTH_HERMES_HTTP || 'https://hermes.pyth.network',
    priceIds: {
      ETHUSD: process.env.PYTH_ETHUSD_ID || null,
      BTCUSD: process.env.PYTH_BTCUSD_ID || null,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'pygo_dev_jwt_secret',
  },
};