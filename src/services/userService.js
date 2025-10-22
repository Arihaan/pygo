const User = require('../models/User');
const walletUtils = require('../utils/wallet');
const encryption = require('../utils/encryption');
const logger = require('../utils/logger');
const transactionService = require('./transactionService');

const registerUser = async (phoneNumber, pin) => {
  const existingUser = await User.findOne({ phoneNumber });
  let user = existingUser;
  if (!user) {
    const { encryptedSecretKey, publicKey } = walletUtils.createEncryptedWallet();
    const hashedPin = encryption.hashPin(pin);
    user = new User({
      phoneNumber,
      encryptedWalletKey: encryptedSecretKey,
      walletAddress: publicKey,
      pin: hashedPin,
      isVerified: true,
    });
    await user.save();
    logger.info(`Created new user with phone number ${phoneNumber}`);
  } else {
    user.pin = encryption.hashPin(pin);
    user.isVerified = true;
    user.lastActivity = Date.now();
    await user.save();
    logger.info(`Updated existing user with phone number ${phoneNumber}`);
  }
  await transactionService.updateUserBalances(user._id);
  return user;
};

const verifyUserPin = async (phoneNumber, pin) => {
  const user = await User.findOne({ phoneNumber });
  if (!user) throw new Error('User not found');
  if (user.isLocked) throw new Error('Account is locked due to too many failed attempts');
  const isPinValid = encryption.verifyPin(pin, user.pin);
  if (!isPinValid) {
    user.pinFailAttempts += 1;
    if (user.pinFailAttempts >= 5) {
      user.isLocked = true;
      logger.warn(`Account locked for ${phoneNumber} due to too many failed PIN attempts`);
    }
    await user.save();
    return false;
  }
  user.pinFailAttempts = 0;
  user.lastActivity = Date.now();
  await user.save();
  return true;
};

const getUserByPhone = async (phoneNumber) => {
  const user = await User.findOne({ phoneNumber });
  if (!user) throw new Error('User not found');
  return user;
};

const getUserBalances = async (phoneNumber) => {
  const user = await getUserByPhone(phoneNumber);
  await transactionService.updateUserBalances(user._id);
  const updatedUser = await User.findById(user._id);
  return updatedUser.tokenBalances;
};

module.exports = {
  registerUser,
  verifyUserPin,
  getUserByPhone,
  getUserBalances,
};


