/**
 * ERC-8004 metadata builder.
 * Adapted from the agent-identity-cli schema/erc8004.js module.
 */

/**
 * Builds and validates an ERC-8004 compliant metadata object.
 *
 * @param {object} params
 * @param {string}   params.name
 * @param {string}   params.description
 * @param {string}   [params.agentVersion]
 * @param {string[]} params.capabilities
 * @param {Array<{type:string,url:string}>} [params.serviceEndpoints]
 * @param {string}   [params.ensName]
 * @returns {object}
 */
export function buildMetadata({ name, description, agentVersion, capabilities, serviceEndpoints, ensName }) {
  if (!name || !name.trim()) {
    throw new Error('Agent name is required.');
  }
  if (!description || !description.trim()) {
    throw new Error('Agent description is required.');
  }
  if (!Array.isArray(capabilities) || capabilities.length === 0) {
    throw new Error('At least one capability is required.');
  }

  const metadata = {
    standard: 'ERC-8004',
    name: name.trim(),
    description: description.trim(),
    agentVersion: agentVersion || '1.0.0',
    created: new Date().toISOString(),
    capabilities: capabilities.map((c) => c.trim()).filter(Boolean),
    serviceEndpoints: (serviceEndpoints || []).map((ep) => ({
      type: ep.type.trim(),
      url: ep.url.trim(),
    })),
  };

  if (ensName && ensName.trim()) {
    metadata.ensName = ensName.trim();
  }

  return metadata;
}
