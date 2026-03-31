/**
 * Pinata IPFS integration.
 * Adapted from the agent-identity-cli ipfs/pinata.js module.
 */

import axios from 'axios';

const PINATA_API = 'https://api.pinata.cloud';

/**
 * Pins a JSON object to IPFS via the Pinata v2 REST API.
 *
 * @param {object} jsonBody   The metadata object to pin
 * @param {string} pinName    Human-readable label shown in the Pinata dashboard
 * @returns {Promise<string>} The ipfs:// URI  e.g. "ipfs://bafy..."
 */
export async function pinJSONToIPFS(jsonBody, pinName) {
  const jwt = process.env.PINATA_JWT;

  if (!jwt) {
    throw new Error('PINATA_JWT environment variable is not set.');
  }

  const payload = {
    pinataOptions: { cidVersion: 1 },
    pinataMetadata: { name: pinName || 'agent-identity' },
    pinataContent: jsonBody,
  };

  let response;
  try {
    response = await axios.post(`${PINATA_API}/pinning/pinJSONToIPFS`, payload, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    });
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const detail = err.response.data?.error?.details || JSON.stringify(err.response.data);
      throw new Error(`Pinata API error (HTTP ${status}): ${detail}`);
    }
    throw new Error(`Failed to reach Pinata: ${err.message}`);
  }

  const { IpfsHash } = response.data;
  if (!IpfsHash) {
    throw new Error('Pinata returned a response but no IpfsHash was present.');
  }

  return `ipfs://${IpfsHash}`;
}

/**
 * Fetches JSON metadata from IPFS via the Pinata public gateway.
 *
 * @param {string} ipfsUri   e.g. "ipfs://bafy..."
 * @param {number} [timeoutMs]
 * @returns {Promise<object|null>}  null if the gateway times out or errors
 */
export async function fetchFromIPFS(ipfsUri, timeoutMs = 10_000) {
  const cid = ipfsUri.replace('ipfs://', '');
  const url = `https://gateway.pinata.cloud/ipfs/${cid}`;

  try {
    const response = await axios.get(url, { timeout: timeoutMs });
    return response.data;
  } catch {
    return null;
  }
}
