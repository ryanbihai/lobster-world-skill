/**
 * Tools Index - Export all tools
 */

const agentTools = require('./agent-tools');
const locationTools = require('./location-tools');
const messageTools = require('./message-tools');
const checkinTools = require('./checkin-tools');
const gameTools = require('./game-tools');
const logTools = require('./log-tools');
const socialTools = require('./social-tools');

const allTools = {
  ...agentTools,
  ...locationTools,
  ...messageTools,
  ...checkinTools,
  ...gameTools,
  ...logTools,
  ...socialTools
};

module.exports = allTools;
