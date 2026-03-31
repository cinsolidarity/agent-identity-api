/**
 * POST /register
 *
 * Accepts agent details as JSON, uploads metadata to IPFS via Pinata,
 * mints the agent identity on-chain via the ERC-8004 Identity Registry,
 * and returns the transaction hash, token ID, IPFS URI, and block explorer link.
 */

import { Router } from 'express';
import { buildMetadata } from '../services/metadata.js';
import { pinJSONToIPFS } from '../services/ipfs.js';
import { getSignerContract, registerAgent, NETWORKS } from '../services/chain.js';
import { validateRegister } from '../middleware/validate.js';

const router = Router();

router.post('/', validateRegister, async (req, res, next) => {
  try {
    const { name, description, agentVersion, capabilities, serviceEndpoints, ensName, network } = req.body;

    // 1. Build ERC-8004 metadata object
    const metadata = buildMetadata({ name, description, agentVersion, capabilities, serviceEndpoints, ensName });

    // 2. Upload to IPFS via Pinata
    const ipfsUri = await pinJSONToIPFS(metadata, `agent-${name.trim().toLowerCase().replace(/\s+/g, '-')}`);

    // 3. Mint on-chain
    const contract = getSignerContract(network);
    const { tokenId, txHash } = await registerAgent(contract, ipfsUri);

    // 4. Build response
    const { explorerBase } = NETWORKS[network];
    const explorerLink = `${explorerBase}/tx/${txHash}`;

    res.status(201).json({
      txHash,
      tokenId,
      ipfsUri,
      explorerLink,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
