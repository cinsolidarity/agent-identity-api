/**
 * Centralised error handler middleware.
 * Catches errors thrown from async route handlers (via next(err))
 * and returns a consistent JSON error response.
 */

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);

  // ethers.js reverts come through as CALL_EXCEPTION
  if (err.code === 'CALL_EXCEPTION') {
    return res.status(400).json({ error: 'Contract call reverted. The token may not exist or the transaction was rejected.' });
  }

  // ethers.js insufficient funds
  if (err.code === 'INSUFFICIENT_FUNDS') {
    return res.status(400).json({ error: 'Insufficient funds to pay for gas. Fund the wallet and retry.' });
  }

  // Treat our own validation/config errors as 400
  const clientErrors = [
    'PINATA_JWT',
    'ALCHEMY_API_KEY',
    'PRIVATE_KEY',
    'required',
    'Unknown network',
    'Invalid',
  ];
  if (clientErrors.some((kw) => err.message.includes(kw))) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: err.message || 'Internal server error.' });
}
