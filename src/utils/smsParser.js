const parseRegister = (text) => {
  const parts = text.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toUpperCase() !== 'REGISTER') return null;
  const pin = parts[1];
  if (!/^\d{4,6}$/.test(pin)) return { command: 'REGISTER', error: 'Invalid PIN. It should be 4-6 digits.' };
  return { command: 'REGISTER', pin };
};

const parseBalance = (text) => {
  const parts = text.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toUpperCase() !== 'BALANCE') return null;
  const pin = parts[1];
  if (!/^\d{4,6}$/.test(pin)) return { command: 'BALANCE', error: 'Invalid PIN. It should be 4-6 digits.' };
  return { command: 'BALANCE', pin };
};

const parseSend = (text) => {
  const parts = text.trim().split(/\s+/);
  if (parts.length !== 5 || parts[0].toUpperCase() !== 'SEND') return null;
  const [_, recipient, amountStr, token, pin] = parts;
  const amount = parseFloat(amountStr);
  if (!/^\+\d{7,15}$/.test(recipient)) return { command: 'SEND', error: 'Invalid recipient phone number. It should include the country code (e.g., +1234567890).' };
  if (isNaN(amount) || amount <= 0) return { command: 'SEND', error: 'Invalid amount. It should be a number greater than 0.' };
  const supportedTokens = ['ETH', 'PYUSD'];
  const normalizedToken = token.toUpperCase();
  if (!supportedTokens.includes(normalizedToken)) return { command: 'SEND', error: `Invalid token. Supported tokens are: ${supportedTokens.join(', ')}.` };
  if (!/^\d{4,6}$/.test(pin)) return { command: 'SEND', error: 'Invalid PIN. It should be 4-6 digits.' };
  return { command: 'SEND', recipient, amount, token: normalizedToken, pin };
};

const parseConfirm = (text) => {
  const parts = text.trim().split(/\s+/);
  if (parts.length !== 3 || parts[0].toUpperCase() !== 'CONFIRM') return null;
  const [_, confirmationCode, pin] = parts;
  if (!/^[a-zA-Z0-9]{4,8}$/.test(confirmationCode)) return { command: 'CONFIRM', error: 'Invalid confirmation code.' };
  if (!/^\d{4,6}$/.test(pin)) return { command: 'CONFIRM', error: 'Invalid PIN. It should be 4-6 digits.' };
  return { command: 'CONFIRM', confirmationCode, pin };
};

const parseHelp = (text) => text.trim().toUpperCase() === 'HELP' ? { command: 'HELP' } : null;
const parseYes = (text) => text.trim().toUpperCase() === 'YES' ? { command: 'YES' } : null;

const parsePrice = (text) => {
  const parts = text.trim().split(/\s+/);
  if (parts[0].toUpperCase() !== 'PRICE') return null;
  const symbol = (parts[1] || 'ETHUSD').toUpperCase();
  return { command: 'PRICE', symbol };
};

const parseSmsCommand = (text) => {
  if (!text) return { error: 'Empty message.' };
  const parsers = [parseRegister, parseBalance, parseSend, parseConfirm, parseHelp, parseYes, parsePrice];
  for (const parser of parsers) {
    const result = parser(text);
    if (result) return result;
  }
  return { error: 'Invalid command format. Text HELP for available commands.' };
};

module.exports = { parseSmsCommand };


