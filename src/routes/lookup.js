/**
 * GET /lookup?tokenId=42&network=base-sepolia
 *
 * Returns the on-chain metadata for a registered agent.
 * Fetches the metadata URI from the contract, then attempts to hydrate
 * the full JSON from the Pinata IPFS gateway with a short timeout.
 * If the gateway is unavailable, on-chain data is still returned.
 */

import { Router } from 'express';
import { getReadContract, lookupToken, NETWORKS } from '../services/chain.js';
import { fetchFromIPFS } from '../services/ipfs.js';
import { validateLookup } from '../middleware/validate.js';

const router = Router();

router.get('/', validateLookup, async (req, res, next) => {
  try {
    const { tokenId, network } = req.query;

    // 1. Fetch on-chain data
    const contract = getReadContract(network);
    const { metadataUri, owner } = await lookupToken(contract, tokenId);

    // 2. Attempt to fetch full metadata from IPFS (graceful degradation)
    const metadata = metadataUri ? await fetchFromIPFS(metadataUri) : null;

    // 3. Build explorer link to the contract page
    const { explorerBase, registryAddress } = NETWORKS[network];
    const explorerLink = `${explorerBase}/token/${registryAddress}?a=${tokenId}`;

    res.json({
      tokenId,
      owner,
      metadataUri,
      metadata: metadata || null,
      explorerLink,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
