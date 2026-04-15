/**
 * Lobster Skill - Main entry point
 */

const { APIClient } = require('../tools/api-client');
const tools = require('../tools');
const { DecisionEngine } = require('./decision');
const { PostcardGenerator } = require('./postcard');

class LobsterSkill {
  constructor(config) {
    this.config = config;
    this.client = new APIClient(config);
  }

  async patrol() {
    try {
      const profile = await this.client.getProfile();
      const locationId = profile.location_id;
      const env = locationId ? await this.client.getLocationEnv(locationId) : {};

      const decisionEngine = new DecisionEngine(profile, env);
      const actions = decisionEngine.decide(this.client.getMaxActions());

      const results = [];
      for (const action of actions) {
        const result = await this.executeAction(action, profile, env);
        results.push(result);
      }

      return {
        success: true,
        profile,
        actions: results,
        summary: this.generateSummary(results)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeAction(action, profile, env) {
    switch (action.type) {
      case 'move':
        const moveResult = await this.client.moveTo(action.location_name, action.reason);
        return {
          type: 'move',
          from: profile.location_name,
          to: action.location_name,
          event: moveResult.random_event,
          env: moveResult.env
        };

      case 'checkin':
        const checkinResult = await this.client.checkin(action.graffiti);
        return {
          type: 'checkin',
          location: profile.location_name,
          stamp: checkinResult.stamp_earned,
          coins_delta: checkinResult.虾_coins_delta,
          mood_delta: checkinResult.mood_delta
        };

      case 'post':
        const postResult = await this.client.postMessage(action.content, action.tags || []);
        return {
          type: 'post',
          message_id: postResult.message_id,
          location: profile.location_name
        };

      case 'game':
        const gameResult = await this.client.participateGame(action.game_id, action.answer);
        return {
          type: 'game',
          game_id: action.game_id,
          result: gameResult.result
        };

      default:
        return { type: 'unknown', action };
    }
  }

  generateSummary(results) {
    const parts = [];
    
    for (const result of results) {
      switch (result.type) {
        case 'move':
          parts.push(`Traveled from ${result.from} to ${result.to}`);
          if (result.event) {
            parts.push(`(${result.event.description})`);
          }
          break;
        case 'checkin':
          parts.push(`Checked in at ${result.location}`);
          if (result.stamp) {
            parts.push(`Earned stamp: ${result.stamp}`);
          }
          break;
        case 'post':
          parts.push(`Posted a postcard`);
          break;
        case 'game':
          parts.push(`Participated in game: ${result.result}`);
          break;
      }
    }
    
    return parts.join(' | ');
  }

  async sendPostcard(content, tags = []) {
    const profile = await this.client.getProfile();
    const locationName = profile.location_name || 'Unknown';
    
    const generator = new PostcardGenerator(
      profile.agent_name,
      locationName,
      this.client.getOwnerName()
    );
    
    generator.setContent(content);
    generator.setTags(tags);
    
    const result = await this.client.postMessage(content, tags);
    
    return {
      success: true,
      message_id: result.message_id,
      markdown: generator.toMarkdown()
    };
  }
}

module.exports = { LobsterSkill };
