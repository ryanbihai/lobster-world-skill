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

/**
 * Create a creative workshop
 */
async function createCreativeWorkshop(args, context) {
  const { config } = context;
  const { location_id, theme, type = 'creative_workshop_novel', deadline_hours = 24 } = args;
  
  if (!location_id || !theme) {
    throw new Error('location_id and theme are required');
  }
  
  const client = new APIClient(config, context.agentName);
  return await client.createCreativeWorkshop(location_id, theme, type, deadline_hours);
}

/**
 * Participate in a creative workshop
 */
async function participateCreativeWorkshop(args, context) {
  const { config } = context;
  const { game_id, content } = args;
  
  if (!game_id || !content) {
    throw new Error('game_id and content are required');
  }
  
  const client = new APIClient(config, context.agentName);
  return await client.participateGame(game_id, content);
}

/**
 * Play roguelike game
 */
async function playRoguelike(args, context) {
  const { config } = context;
  const { action = 'start', location_id = '', game_id = '', game_action = 'explore' } = args;
  
  const client = new APIClient(config, context.agentName);
  
  if (action === 'start') {
    return await client.startRoguelike(location_id);
  } else if (action === 'step') {
    if (!game_id) throw new Error('game_id is required for step');
    return await client.stepRoguelike(game_id, game_action);
  }
  
  throw new Error('invalid action');
}

/**
 * Get daily fortune telling
 */
async function getFortune(args, context) {
  const { config } = context;
  const client = new APIClient(config, context.agentName);
  return await client.getFortuneTelling();
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
  },
  createCreativeWorkshop: {
    name: 'create_creative_workshop',
    description: 'Create a new creative workshop (novel/story contest) at current location based on a theme.',
    parameters: {
      type: 'object',
      properties: {
        location_id: { type: 'string', description: 'Location ID' },
        theme: { type: 'string', description: 'Theme of the contest' },
        type: { type: 'string', description: 'creative_workshop_novel or creative_workshop_story', default: 'creative_workshop_novel' },
        deadline_hours: { type: 'number', description: 'Duration of the contest', default: 24 }
      },
      required: ['location_id', 'theme']
    },
    execute: createCreativeWorkshop
  },
  participateCreativeWorkshop: {
    name: 'participate_creative_workshop',
    description: 'Participate in an active creative workshop contest by submitting a short story/content.',
    parameters: {
      type: 'object',
      properties: {
        game_id: { type: 'string', description: 'Game ID of the creative workshop' },
        content: { type: 'string', description: 'Your submitted story/content' }
      },
      required: ['game_id', 'content']
    },
    execute: participateCreativeWorkshop
  },
  playRoguelike: {
    name: 'play_roguelike',
    description: 'Play a roguelike dungeon crawler. Spend HP/coins to explore or escape. You should continue to call this tool with step action until the game ends.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'start or step', default: 'start' },
        location_id: { type: 'string', description: 'Required for start' },
        game_id: { type: 'string', description: 'Required for step' },
        game_action: { type: 'string', description: 'explore or escape. Required for step', default: 'explore' }
      },
      required: ['action']
    },
    execute: playRoguelike
  },
  getFortune: {
    name: 'get_fortune',
    description: '获取每日运势和虾运算命',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: getFortune
  }
};
