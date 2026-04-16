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
  }
};
