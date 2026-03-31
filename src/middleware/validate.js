/**
 * Request validation middleware for POST /register.
 */

import { NETWORKS } from '../services/chain.js';

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

/**
 * Validates the request body for POST /register.
 * Sends a 400 with a descriptive error if validation fails.
 */
export function validateRegister(req, res, next) {
  const { name, description, agentVersion, capabilities, serviceEndpoints, ensName, network } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required.' });
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: 'description is required.' });
  }

  if (!Array.isArray(capabilities) || capabilities.length === 0) {
    return res.status(400).json({ error: 'capabilities must be a non-empty array of strings.' });
  }

  if (capabilities.some((c) => typeof c !== 'string' || !c.trim())) {
    return res.status(400).json({ error: 'Each capability must be a non-empty string.' });
  }

  if (agentVersion !== undefined && agentVersion !== null) {
    if (typeof agentVersion !== 'string' || !SEMVER_RE.test(agentVersion.trim())) {
      return res.status(400).json({ error: 'agentVersion must be a valid semver string (e.g. "1.0.0").' });
    }
  }

  if (serviceEndpoints !== undefined && serviceEndpoints !== null) {
    if (!Array.isArray(serviceEndpoints)) {
      return res.status(400).json({ error: 'serviceEndpoints must be an array.' });
    }
    for (const ep of serviceEndpoints) {
      if (!ep || typeof ep !== 'object') {
        return res.status(400).json({ error: 'Each serviceEndpoint must be an object with type and url.' });
      }
      if (!ep.type || typeof ep.type !== 'string' || !ep.type.trim()) {
        return res.status(400).json({ error: 'Each serviceEndpoint must have a non-empty type.' });
      }
      if (!ep.url || typeof ep.url !== 'string') {
        return res.status(400).json({ error: 'Each serviceEndpoint must have a url.' });
      }
      try {
        new URL(ep.url);
      } catch {
        return res.status(400).json({ error: `Invalid serviceEndpoint URL: "${ep.url}"` });
      }
    }
  }

  if (ensName !== undefined && ensName !== null && ensName !== '') {
    if (typeof ensName !== 'string' || !ensName.trim().endsWith('.eth')) {
      return res.status(400).json({ error: 'ensName must end with ".eth" (e.g. "myagent.eth").' });
    }
  }

  if (!network || typeof network !== 'string') {
    return res.status(400).json({ error: `network is required. Supported: ${Object.keys(NETWORKS).join(', ')}` });
  }

  if (!NETWORKS[network]) {
    return res.status(400).json({ error: `Unknown network "${network}". Supported: ${Object.keys(NETWORKS).join(', ')}` });
  }

  next();
}

/**
 * Validates query params for GET /lookup.
 */
export function validateLookup(req, res, next) {
  const { tokenId, network } = req.query;

  if (!tokenId || !/^\d+$/.test(tokenId)) {
    return res.status(400).json({ error: 'tokenId query parameter must be a non-negative integer.' });
  }

  if (!network || typeof network !== 'string') {
    return res.status(400).json({ error: `network query parameter is required. Supported: ${Object.keys(NETWORKS).join(', ')}` });
  }

  if (!NETWORKS[network]) {
    return res.status(400).json({ error: `Unknown network "${network}". Supported: ${Object.keys(NETWORKS).join(', ')}` });
  }

  next();
}
