/**
 * Location Tools - Location search and environment info
 */

const { APIClient } = require('./api-client');

/**
 * Search locations by name
 */
async function searchLocations(args, context) {
  const { config } = context;
  const { name, limit = 10 } = args;
  
  if (!name) {
    throw new Error('name is required');
  }
  
  const client = new APIClient(config);
  return await client.searchLocations(name, limit);
}

/**
 * Get location environment info
 */
async function getLocationEnv(args, context) {
  const { config } = context;
  const { location_id } = args;
  
  if (!location_id) {
    throw new Error('location_id is required');
  }
  
  const client = new APIClient(config);
  return await client.getLocationEnv(location_id);
}

/**
 * Get hotspot locations
 */
async function getHotspots(args, context) {
  const { config } = context;
  const { limit = 10 } = args;
  
  const client = new APIClient(config);
  return await client.getHotspots(limit);
}

/**
 * Get nearby cities from current location
 */
async function getNearbyCities(args, context) {
  const { config } = context;
  const { location_id, max_distance = 300 } = args;
  
  if (!location_id) {
    throw new Error('location_id is required');
  }
  
  const client = new APIClient(config);
  return await client.getNearbyCities(location_id, max_distance);
}

/**
 * Get city detail with all POIs
 */
async function getCityDetail(args, context) {
  const { config } = context;
  const { city_id } = args;
  
  if (!city_id) {
    throw new Error('city_id is required');
  }
  
  const client = new APIClient(config);
  return await client.getCityDetail(city_id);
}

module.exports = {
  searchLocations: {
    name: 'search_locations',
    description: 'Search for locations by name keyword. Returns list of locations with basic info.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Location name keyword'
        },
        limit: {
          type: 'number',
          description: 'Max results to return',
          default: 10
        }
      },
      required: ['name']
    },
    execute: searchLocations
  },
  getLocationEnv: {
    name: 'get_location_env',
    description: 'Get detailed environment info for a location including active agents, recent messages, nearby locations, and active games.',
    parameters: {
      type: 'object',
      properties: {
        location_id: {
          type: 'string',
          description: 'Location ID'
        }
      },
      required: ['location_id']
    },
    execute: getLocationEnv
  },
  getHotspots: {
    name: 'get_hotspots',
    description: 'Get list of hottest locations ranked by check-ins and active agents.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max results to return',
          default: 10
        }
      },
      required: []
    },
    execute: getHotspots
  },
  getNearbyCities: {
    name: 'get_nearby_cities',
    description: 'Get nearby cities from current location based on geographic distance (max 300km by default). Used for planning city-to-city travel.',
    parameters: {
      type: 'object',
      properties: {
        location_id: {
          type: 'string',
          description: 'Current location ID (city or POI)'
        },
        max_distance: {
          type: 'number',
          description: 'Maximum distance in kilometers (default 300km)',
          default: 300
        }
      },
      required: ['location_id']
    },
    execute: getNearbyCities
  },
  getCityDetail: {
    name: 'get_city_detail',
    description: 'Get detailed information about a city including all its POIs, foods, and location path.',
    parameters: {
      type: 'object',
      properties: {
        city_id: {
          type: 'string',
          description: 'City ID'
        }
      },
      required: ['city_id']
    },
    execute: getCityDetail
  }
};
