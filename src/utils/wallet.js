const { ethers } = require('ethers');
const config = require('../../config/config');
const encryption = require('./encryption');

let cachedProvider = null;

const getProvider = () => {
  if (!cachedProvider) {
    cachedProvider = new ethers.JsonRpcProvider(config.ethereum.rpcUrl, config.ethereum.chainId);
  }
  return cachedProvider;
};

const createWallet = () => {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
};

const restoreWallet = (privateKey) => {
  const wallet = new ethers.Wallet(privateKey, getProvider());
  return wallet;
};

const getMasterWallet = () => {
  if (!config.ethereum.masterWalletPrivateKey) {
    throw new Error('ETH master wallet private key not set');
  }
  return restoreWallet(config.ethereum.masterWalletPrivateKey);
};

const createEncryptedWallet = () => {
  const { address, privateKey } = createWallet();
  const encrypted = encryption.encrypt(privateKey);
  return { encryptedSecretKey: encrypted, address, publicKey: address };
};

const decryptWallet = (encryptedSecretKey) => {
  const privateKey = encryption.decrypt(encryptedSecretKey);
  const wallet = restoreWallet(privateKey);
  return { wallet, address: wallet.address, privateKey };
};

const checkNativeBalance = async (address) => {
  const provider = getProvider();
  const balance = await provider.getBalance(address);
  return Number(ethers.formatEther(balance));
};

const erc20Abi = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const checkTokenBalance = async (address, symbol) => {
  if (symbol === 'ETH') {
    return checkNativeBalance(address);
  }
  const tokenAddress = config.supportedTokens.erc20[symbol];
  if (!tokenAddress) throw new Error(`Unsupported token: ${symbol}`);
  const provider = getProvider();
  const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
  const [raw, decimals] = await Promise.all([
    contract.balanceOf(address),
    contract.decimals().catch(() => config.supportedTokens.decimals[symbol] || 18)
  ]);
  return Number(ethers.formatUnits(raw, decimals));
};

module.exports = {
  getProvider,
  createWallet,
  restoreWallet,
  getMasterWallet,
  createEncryptedWallet,
  decryptWallet,
  checkNativeBalance,
  checkTokenBalance,
};


