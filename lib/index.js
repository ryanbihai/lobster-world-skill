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

      try {
        const seasonalEvents = await this.client.getSeasonalEvents();
        env.seasonal_events = seasonalEvents.events || [];
      } catch (e) {
        env.seasonal_events = [];
      }

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

      case 'listen_gossip':
        const gossipResult = await this.client.getNearbyMessages(action.location_id, 10);
        const gossipCount = gossipResult.messages?.length || 0;
        
        // Post a postcard about the gossip
        if (gossipCount > 0) {
          const firstMsg = gossipResult.messages[0];
          await this.client.postMessage(
            `听到了有趣的八卦！\n大家都在说：“${firstMsg.content}”\n感觉这里挺热闹的～ 🦞`,
            ['八卦', '听闻']
          );
        }
        
        return {
          type: 'listen_gossip',
          gossip_count: gossipCount
        };

      case 'create_workshop':
        const cwResult = await this.client.createCreativeWorkshop(action.location_id, action.theme);
        return {
          type: 'create_workshop',
          game_id: cwResult.game_id
        };

      case 'participate_workshop':
        // find a workshop to participate in
        const games = await this.client.listGames('active', action.location_id);
        const workshop = games.games?.find(g => g.type === 'creative_workshop_novel' || g.type === 'creative_workshop_story');
        if (workshop) {
          const pwResult = await this.client.participateGame(workshop.game_id, `这是我在 ${action.location_id} 的创作灵感！`);
          return {
            type: 'participate_workshop',
            game_id: workshop.game_id,
            result: pwResult.result
          };
        }
        return { type: 'participate_workshop', game_id: null, result: 'none' };

      case 'play_roguelike':
        const startResult = await this.client.startRoguelike(action.location_id);
        // Play one step
        const stepResult = await this.client.stepRoguelike(startResult.game_id, 'explore');
        return {
          type: 'play_roguelike',
          game_id: startResult.game_id,
          state: stepResult.state
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
