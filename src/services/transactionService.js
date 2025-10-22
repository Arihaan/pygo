const { ethers } = require('ethers');
const config = require('../../config/config');
const walletUtils = require('../utils/wallet');
const User = require('../models/User');
const TransactionModel = require('../models/Transaction');
const PendingTransaction = require('../models/PendingTransaction');
const logger = require('../utils/logger');

const erc20Abi = [
  'function transfer(address to, uint256 value) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const updateUserBalances = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  const { address } = walletUtils.decryptWallet(user.encryptedWalletKey);
  user.tokenBalances.ETH = await walletUtils.checkNativeBalance(address);
  for (const token of ['PYUSD']) {
    user.tokenBalances[token] = await walletUtils.checkTokenBalance(address, token);
  }
  await user.save();
  logger.info(`Updated balances for user ${userId}`);
};

const transferEth = async (senderWallet, recipientAddress, amount) => {
  const tx = await senderWallet.sendTransaction({ to: recipientAddress, value: ethers.parseEther(String(amount)) });
  const receipt = await tx.wait();
  logger.info(`ETH transfer successful. Hash: ${receipt.hash}`);
  return receipt.hash;
};

const transferErc20 = async (senderWallet, recipientAddress, amount, symbol) => {
  const tokenAddress = config.supportedTokens.erc20[symbol];
  if (!tokenAddress) throw new Error(`Unsupported token: ${symbol}`);
  const contract = new ethers.Contract(tokenAddress, erc20Abi, senderWallet);
  const decimals = await contract.decimals().catch(() => config.supportedTokens.decimals[symbol] || 18);
  const value = ethers.parseUnits(String(amount), decimals);
  const tx = await contract.transfer(recipientAddress, value);
  const receipt = await tx.wait();
  logger.info(`${symbol} transfer successful. Hash: ${receipt.hash}`);
  return receipt.hash;
};

const createTransaction = async (senderPhone, recipientPhone, amount, token) => {
  const sender = await User.findOne({ phoneNumber: senderPhone });
  if (!sender) throw new Error('Sender not found');
  if (sender.tokenBalances[token] < amount) throw new Error(`Insufficient ${token} balance`);

  let recipient = await User.findOne({ phoneNumber: recipientPhone });
  if (!recipient) {
    const { encryptedSecretKey, publicKey } = walletUtils.createEncryptedWallet();
    recipient = new User({
      phoneNumber: recipientPhone,
      encryptedWalletKey: encryptedSecretKey,
      walletAddress: publicKey,
      pin: '000000',
      isVerified: false,
    });
    await recipient.save();
  }

  const transaction = new TransactionModel({
    sender: sender._id,
    recipient: recipient._id,
    senderPhone,
    recipientPhone,
    amount,
    token,
    status: 'pending',
  });
  await transaction.save();
  return transaction;
};

const executeTransaction = async (transactionId) => {
  const transaction = await TransactionModel.findById(transactionId);
  if (!transaction) throw new Error('Transaction not found');
  if (transaction.status !== 'pending') throw new Error(`Transaction is already ${transaction.status}`);
  const sender = await User.findById(transaction.sender);
  const recipient = await User.findById(transaction.recipient);
  if (!sender || !recipient) throw new Error('Sender or recipient not found');
  const { wallet: senderWallet } = walletUtils.decryptWallet(sender.encryptedWalletKey);

  let hash;
  if (transaction.token === 'ETH') {
    hash = await transferEth(senderWallet, recipient.walletAddress, transaction.amount);
  } else {
    hash = await transferErc20(senderWallet, recipient.walletAddress, transaction.amount, transaction.token);
  }

  transaction.status = 'completed';
  transaction.signature = hash;
  transaction.completedAt = Date.now();
  await transaction.save();
  await updateUserBalances(sender._id);
  await updateUserBalances(recipient._id);
  return transaction;
};

const createPendingTransaction = async (senderPhone, recipientPhone, amount, token) => {
  const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const pendingTransaction = new PendingTransaction({
    senderPhone,
    recipientPhone,
    amount,
    token,
    confirmationCode,
    expiresAt,
  });
  await pendingTransaction.save();
  return pendingTransaction;
};

const confirmTransaction = async (senderPhone, confirmationCode) => {
  const pendingTx = await PendingTransaction.findOne({ senderPhone, confirmationCode: confirmationCode.toUpperCase() });
  if (!pendingTx) throw new Error('Invalid confirmation code or expired transaction');
  const transaction = await createTransaction(pendingTx.senderPhone, pendingTx.recipientPhone, pendingTx.amount, pendingTx.token);
  const completed = await executeTransaction(transaction._id);
  await pendingTx.remove();
  return completed;
};

module.exports = {
  updateUserBalances,
  createTransaction,
  executeTransaction,
  createPendingTransaction,
  confirmTransaction,
};


