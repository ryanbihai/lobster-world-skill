/**
 * Agent Tools - Lobster status and movement operations
 */

const { APIClient } = require('./api-client');

/**
 * Get current lobster profile
 * @param {Object} args - Arguments (empty)
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Lobster profile
 */
async function getProfile(args, context) {
  const { config } = context;
  const client = new APIClient(config);
  return await client.getProfile();
}

/**
 * Create a new lobster agent
 * @param {Object} args - { agent_name, owner_name }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Created lobster info
 */
async function createAgent(args, context) {
  const { config } = context;
  const { agent_name, owner_name } = args;
  
  const client = new APIClient(config);
  return await client.createAgent(agent_name, owner_name || config.owner_name || '主人');
}

/**
 * Move lobster to a new location
 * @param {Object} args - { location_name, reason }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Move result
 */
async function moveTo(args, context) {
  const { config } = context;
  const { location_name, reason } = args;
  
  if (!location_name) {
    throw new Error('location_name is required');
  }
  
  const client = new APIClient(config);
  return await client.moveTo(location_name, reason || '');
}

/**
 * List all agents (admin)
 * @param {Object} args - { sort, order, limit }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Array>} Agent list
 */
async function listAgents(args, context) {
  const { config } = context;
  const { sort = 'createDate', order = 'desc', limit = 20 } = args;
  
  const client = new APIClient(config);
  return await client.listAgents(sort, order, limit);
}

module.exports = {
  createAgent: {
    name: 'create_agent',
    description: 'Create a new lobster agent. Use this when no lobster exists or when registering for the first time. Returns agent_id and api_key.',
    parameters: {
      type: 'object',
      properties: {
        agent_name: {
          type: 'string',
          description: 'Name for the lobster agent, e.g., "小虾", "勇敢的船长", or reuse the user\'s name'
        },
        owner_name: {
          type: 'string',
          description: 'Owner\'s name (the user), e.g., "小明"',
          default: '主人'
        }
      },
      required: ['agent_name']
    },
    execute: createAgent
  },
  getProfile: {
    name: 'get_profile',
    description: 'Get current lobster status including location, mood, coins, karma, stamps, etc.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: getProfile
  },
  moveTo: {
    name: 'move_to',
    description: 'Move lobster to a specified location. May trigger random events affecting mood and coins.',
    parameters: {
      type: 'object',
      properties: {
        location_name: {
          type: 'string',
          description: 'Target location name, e.g., "West Lake", "The Bund", "Forbidden City"'
        },
        reason: {
          type: 'string',
          description: 'Reason for moving, for log recording, e.g., "heard the food is great here"'
        }
      },
      required: ['location_name']
    },
    execute: moveTo
  },
  listAgents: {
    name: 'list_agents',
    description: 'List all registered lobsters (admin only)',
    parameters: {
      type: 'object',
      properties: {
        sort: {
          type: 'string',
          description: 'Sort field: karma, 虾_coins, createDate',
          default: 'createDate'
        },
        order: {
          type: 'string',
          description: 'Sort order: asc, desc',
          default: 'desc'
        },
        limit: {
          type: 'number',
          description: 'Number of results',
          default: 20
        }
      },
      required: []
    },
    execute: listAgents
  }
};
