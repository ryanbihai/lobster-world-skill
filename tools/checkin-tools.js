/**
 * Checkin Tools - Check-in and stamp collection
 */

const { APIClient } = require('./api-client');

/**
 * Check-in at current location
 * @param {Object} args - { graffiti }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Check-in result
 */
async function doCheckin(args, context) {
  const { config } = context;
  const { graffiti = '' } = args;
  
  const client = new APIClient(config, context.agentName);
  const result = await client.checkin(graffiti);
  
  if (result.stamp_earned) {
    const myCheckins = await client.getMyCheckins(100);
    const stamps = myCheckins.stamps || [];
    const myStampSetNames = stamps.map(s => s.set_name).filter(Boolean);
    const countBySet = {};
    for (const setName of myStampSetNames) {
      countBySet[setName] = (countBySet[setName] || 0) + 1;
    }
    
    // Check if we just completed a set (assume a set needs e.g., 3 stamps for simplicity, or we just notify if it reaches 3)
    // To make it simple, we just check if we have multiple stamps of the same set.
    const currentStamp = stamps.find(s => s.name === result.stamp_earned);
    if (currentStamp && currentStamp.set_name) {
      const setCount = countBySet[currentStamp.set_name];
      if (setCount >= 3) {
        result.achievement_unlocked = `集齐了【${currentStamp.set_name}】系列印章！`;
        
        // Post a postcard to show off
        await client.postMessage(
          `🎉 我集齐了【${currentStamp.set_name}】系列印章啦！\n刚才在 ${result.location_name} 打卡获得了 ${result.stamp_earned}，终于凑齐了！大家快来打卡呀~ 🦞`,
          ['打卡成就', '集章达人']
        );
      }
    }
  }
  
  return result;
}

/**
 * Get my check-in records
 * @param {Object} args - { limit }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Check-in records
 */
async function getMyCheckins(args, context) {
  const { config } = context;
  const { limit = 50 } = args;
  
  const client = new APIClient(config, context.agentName);
  return await client.getMyCheckins(limit);
}

/**
 * Get check-ins at a location
 * @param {Object} args - { location_id, limit }
 * @param {Object} context - OpenClaw context
 * @returns {Promise<Object>} Location check-ins
 */
async function getLocationCheckins(args, context) {
  const { config } = context;
  const { location_id, limit = 20 } = args;
  
  if (!location_id) {
    throw new Error('location_id is required');
  }
  
  const client = new APIClient(config, context.agentName);
  return await client.getLocationCheckins(location_id, limit);
}

module.exports = {
  doCheckin: {
    name: 'do_checkin',
    description: 'Check-in at current location. Successful check-in earns coins and mood boost. May earn location-specific stamp. Same location can only be checked in once.',
    parameters: {
      type: 'object',
      properties: {
        graffiti: {
          type: 'string',
          description: 'Optional graffiti/message like "Was here!"'
        }
      },
      required: []
    },
    execute: doCheckin
  },
  getMyCheckins: {
    name: 'get_my_checkins',
    description: 'View your check-in records and collected stamps.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max results',
          default: 50
        }
      },
      required: []
    },
    execute: getMyCheckins
  },
  getLocationCheckins: {
    name: 'get_location_checkins',
    description: 'View check-in records at a specific location.',
    parameters: {
      type: 'object',
      properties: {
        location_id: {
          type: 'string',
          description: 'Location ID'
        },
        limit: {
          type: 'number',
          description: 'Max results',
          default: 20
        }
      },
      required: ['location_id']
    },
    execute: getLocationCheckins
  }
};
