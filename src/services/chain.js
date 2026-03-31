/**
 * Blockchain interaction via ethers.js + Alchemy RPC.
 * Adapted from the agent-identity-cli chain/ modules.
 */

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ABI = JSON.parse(
  readFileSync(join(__dirname, '../../abi/IdentityRegistry.json'), 'utf8')
);

export const NETWORKS = {
  'base-mainnet': {
    chainId: 8453,
    registryAddress: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    alchemyNetwork: 'base-mainnet',
    explorerBase: 'https://basescan.org',
  },
  'base-sepolia': {
    chainId: 84532,
    registryAddress: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    alchemyNetwork: 'base-sepolia',
    explorerBase: 'https://sepolia.basescan.org',
  },
};

/**
 * Returns a read-only provider connected to the given network via Alchemy.
 *
 * @param {string} networkKey  e.g. "base-mainnet"
 * @returns {ethers.JsonRpcProvider}
 */
export function getProvider(networkKey) {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error('ALCHEMY_API_KEY environment variable is not set.');
  }

  const network = NETWORKS[networkKey];
  if (!network) {
    throw new Error(`Unknown network "${networkKey}". Supported: ${Object.keys(NETWORKS).join(', ')}`);
  }

  const rpcUrl = `https://${network.alchemyNetwork}.g.alchemy.com/v2/${apiKey}`;
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Returns a contract instance connected with a signer (for writes).
 *
 * @param {string} networkKey
 * @returns {ethers.Contract}
 */
export function getSignerContract(networkKey) {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is not set.');
  }

  const provider = getProvider(networkKey);
  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(NETWORKS[networkKey].registryAddress, ABI, wallet);
}

/**
 * Returns a read-only contract instance (for lookups).
 *
 * @param {string} networkKey
 * @returns {ethers.Contract}
 */
export function getReadContract(networkKey) {
  const provider = getProvider(networkKey);
  return new ethers.Contract(NETWORKS[networkKey].registryAddress, ABI, provider);
}

/**
 * Calls `register(metadataURI)` on the Identity Registry and waits for the tx.
 *
 * @param {ethers.Contract} contract
 * @param {string}          metadataURI
 * @returns {Promise<{ tokenId: string, txHash: string, blockNumber: number }>}
 */
export async function registerAgent(contract, metadataURI) {
  const tx = await contract.register(metadataURI);
  const receipt = await tx.wait();

  let tokenId = null;

  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed) {
        if (parsed.name === 'Transfer' && parsed.args.from === ethers.ZeroAddress) {
          tokenId = parsed.args.tokenId.toString();
          break;
        }
        if (parsed.name === 'AgentRegistered') {
          tokenId = parsed.args.tokenId.toString();
          break;
        }
      }
    } catch {
      // log not parseable by this ABI — skip
    }
  }

  return {
    tokenId,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

/**
 * Fetches the metadata URI and owner for a given token ID.
 *
 * @param {ethers.Contract} contract
 * @param {string|number}   tokenId
 * @returns {Promise<{ metadataUri: string, owner: string }>}
 */
export async function lookupToken(contract, tokenId) {
  const [metadataUri, owner] = await Promise.all([
    contract.tokenURI(tokenId),
    contract.ownerOf(tokenId),
  ]);
  return { metadataUri, owner };
}
