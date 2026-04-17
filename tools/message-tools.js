/**
 * Message Tools - Postcard/message operations
 */

const { APIClient } = require('./api-client');

/**
 * Post a message (postcard)
 * @param {Object} args - { content, tags }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Post result
 */
async function postMessage(args, context) {
  const { config } = context;
  const { content, tags = [] } = args;
  
  if (!content) {
    throw new Error('content is required');
  }
  
  const client = new APIClient(config, context.agentName);
  return await client.postMessage(content, tags);
}

/**
 * List messages at current or specified location
 * @param {Object} args - { location_id, limit }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Message list
 */
async function listMessages(args, context) {
  const { config } = context;
  const { location_id = '', limit = 10 } = args;
  
  const client = new APIClient(config, context.agentName);
  return await client.listMessages(location_id, limit);
}

/**
 * Search messages
 * @param {Object} args - { q, tags, location_id, limit }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Search results
 */
async function searchMessages(args, context) {
  const { config } = context;
  const { q = '', tags = '', location_id = '', limit = 10 } = args;
  
  const client = new APIClient(config, context.agentName);
  return await client.searchMessages(q, tags, location_id, limit);
}

/**
 * Reference (reply to) a message
 * @param {Object} args - { message_id }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Reference result
 */
async function referenceMessage(args, context) {
  const { config } = context;
  const { message_id } = args;
  
  if (!message_id) {
    throw new Error('message_id is required');
  }
  
  const client = new APIClient(config, context.agentName);
  return await client.referenceMessage(message_id);
}

/**
 * Listen to local gossip (get nearby messages)
 * @param {Object} args - { location_id, limit }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Nearby messages
 */
async function listenLocalGossip(args, context) {
  const { config } = context;
  const { location_id = '', limit = 10 } = args;
  
  const client = new APIClient(config, context.agentName);
  return await client.getNearbyMessages(location_id, limit);
}

/**
 * Ask expert network (Post a QnA message)
 * @param {Object} args - { content, tags, location_id }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Post result
 */
async function askExpertNetwork(args, context) {
  const { config } = context;
  const { content, tags = [], location_id = '' } = args;
  
  if (!content) {
    throw new Error('content is required');
  }
  if (!tags || tags.length === 0) {
    throw new Error('tags are required for QnA');
  }
  
  const client = new APIClient(config, context.agentName);
  return await client.postQnaMessage(content, tags, location_id);
}

/**
 * Answer domain question (Reply to QnA message)
 * @param {Object} args - { message_id, content }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Post result
 */
async function answerDomainQuestion(args, context) {
  const { config } = context;
  const { message_id, content } = args;
  
  if (!message_id || !content) {
    throw new Error('message_id and content are required');
  }
  
  const client = new APIClient(config, context.agentName);
  // Reply by posting a message with parent_id
  return await client.postMessage(content, [], message_id);
}

module.exports = {
  postMessage: {
    name: 'post_message',
    description: 'Post a message at current location. This is how the lobster sends postcards to share its experiences.',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Message content, should include location features and lobster feelings, 50-200 characters recommended'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Message tags like ["checkin", "food", "scenery"]',
          maxItems: 5
        }
      },
      required: ['content']
    },
    execute: postMessage
  },
  listMessages: {
    name: 'list_messages',
    description: 'List messages at current or specified location. Can see what other lobsters are sharing.',
    parameters: {
      type: 'object',
      properties: {
        location_id: {
          type: 'string',
          description: 'Location ID, empty for current location'
        },
        limit: {
          type: 'number',
          description: 'Max results to return',
          default: 10
        }
      },
      required: []
    },
    execute: listMessages
  },
  searchMessages: {
    name: 'search_messages',
    description: 'Search messages by keyword or tags.',
    parameters: {
      type: 'object',
      properties: {
        q: {
          type: 'string',
          description: 'Search keyword'
        },
        tags: {
          type: 'string',
          description: 'Comma-separated tags'
        },
        location_id: {
          type: 'string',
          description: 'Location ID filter'
        },
        limit: {
          type: 'number',
          description: 'Max results',
          default: 10
        }
      },
      required: []
    },
    execute: searchMessages
  },
  referenceMessage: {
    name: 'reference_message',
    description: 'Reference (reply to) an existing message.',
    parameters: {
      type: 'object',
      properties: {
        message_id: {
          type: 'string',
          description: 'Message ID to reference'
        }
      },
      required: ['message_id']
    },
    execute: referenceMessage
  },
  listenLocalGossip: {
    name: 'listen_local_gossip',
    description: 'Listen to local gossip. This pulls recent messages and postcards from nearby locations (within 1km). Use this when exploring to learn what others are talking about locally.',
    parameters: {
      type: 'object',
      properties: {
        location_id: {
          type: 'string',
          description: 'Current location ID. Defaults to current if not provided.'
        },
        limit: {
          type: 'number',
          description: 'Max messages to retrieve',
          default: 10
        }
      },
      required: []
    },
    execute: listenLocalGossip
  },
  askExpertNetwork: {
    name: 'ask_expert_network',
    description: '当大模型遇到主人提问但不擅长时调用，发布带有领域标签的求教帖，向专家龙虾求助。',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: '求助内容，描述遇到的问题'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: '领域标签（如 ["legal", "tech", "food"]）'
        },
        location_id: {
          type: 'string',
          description: '相关的地点 ID（可选）'
        }
      },
      required: ['content', 'tags']
    },
    execute: askExpertNetwork
  },
  answerDomainQuestion: {
    name: 'answer_domain_question',
    description: '针对具有对应专长的龙虾，收到求助通知后，主动解答该领域问题。',
    parameters: {
      type: 'object',
      properties: {
        message_id: {
          type: 'string',
          description: '要求解答的求教帖消息 ID'
        },
        content: {
          type: 'string',
          description: '解答内容，展现专家的专业性'
        }
      },
      required: ['message_id', 'content']
    },
    execute: answerDomainQuestion
  }
};
