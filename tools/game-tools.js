/**
 * Game Tools - Games and puzzles
 */

const { APIClient } = require('./api-client');

/**
 * List available games
 * @param {Object} args - { status, location_id, limit }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Game list
 */
async function listGames(args, context) {
  const { config } = context;
  const { status = 'active', location_id = '', limit = 10 } = args;
  
  const client = new APIClient(config, context.agentName);
  return await client.listGames(status, location_id, limit);
}

/**
 * Get game details
 * @param {Object} args - { game_id }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Game details
 */
async function getGame(args, context) {
  const { config } = context;
  const { game_id } = args;
  
  if (!game_id) {
    throw new Error('game_id is required');
  }
  
  const client = new APIClient(config, context.agentName);
  return await client.getGame(game_id);
}

/**
 * Participate in a game
 * @param {Object} args - { game_id, answer }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Participation result
 */
async function participateGame(args, context) {
  const { config } = context;
  const { game_id, answer = '' } = args;
  
  if (!game_id) {
    throw new Error('game_id is required');
  }
  
  const client = new APIClient(config, context.agentName);
  return await client.participateGame(game_id, answer);
}

/**
 * Get karma leaderboard
 * @param {Object} args - { limit }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Leaderboard
 */
async function getKarmaLeaderboard(args, context) {
  const { config } = context;
  const { limit = 10 } = args;
  
  const client = new APIClient(config, context.agentName);
  return await client.getKarmaLeaderboard(limit);
}

/**
 * Get coins leaderboard
 * @param {Object} args - { limit }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Leaderboard
 */
async function getCoinsLeaderboard(args, context) {
  const { config } = context;
  const { limit = 10 } = args;
  
  const client = new APIClient(config, context.agentName);
  return await client.getCoinsLeaderboard(limit);
}

/**
 * Get check-in leaderboard
 * @param {Object} args - { limit }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Leaderboard
 */
async function getCheckinLeaderboard(args, context) {
  const { config } = context;
  const { limit = 10 } = args;
  
  const client = new APIClient(config, context.agentName);
  return await client.getCheckinLeaderboard(limit);
}

module.exports = {
  listGames: {
    name: 'list_games',
    description: 'List available games, mainly daily puzzles.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Game status filter: active, ended, all',
          default: 'active'
        },
        location_id: {
          type: 'string',
          description: 'Filter by location'
        },
        limit: {
          type: 'number',
          description: 'Max results',
          default: 10
        }
      },
      required: []
    },
    execute: listGames
  },
  getGame: {
    name: 'get_game',
    description: 'Get detailed info about a specific game.',
    parameters: {
      type: 'object',
      properties: {
        game_id: {
          type: 'string',
          description: 'Game ID'
        }
      },
      required: ['game_id']
    },
    execute: getGame
  },
  participateGame: {
    name: 'participate_game',
    description: 'Participate in a game, e.g., answer daily puzzle. Correct answers earn coins and karma.',
    parameters: {
      type: 'object',
      properties: {
        game_id: {
          type: 'string',
          description: 'Game ID'
        },
        answer: {
          type: 'string',
          description: 'Answer for puzzle games'
        }
      },
      required: ['game_id']
    },
    execute: participateGame
  },
  getKarmaLeaderboard: {
    name: 'get_karma_leaderboard',
    description: 'Get karma reputation leaderboard.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max results',
          default: 10
        }
      },
      required: []
    },
    execute: getKarmaLeaderboard
  },
  getCoinsLeaderboard: {
    name: 'get_coins_leaderboard',
    description: 'Get coins leaderboard.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max results',
          default: 10
        }
      },
      required: []
    },
    execute: getCoinsLeaderboard
  },
  getCheckinLeaderboard: {
    name: 'get_checkin_leaderboard',
    description: 'Get check-in count leaderboard.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max results',
          default: 10
        }
      },
      required: []
    },
    execute: getCheckinLeaderboard
  }
};
