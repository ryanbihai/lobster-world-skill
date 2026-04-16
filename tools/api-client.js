/**
 * API Client for Lobster Travel Backend
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const KEY_FILE_PATH = path.join(os.homedir(), '.lobster-world-key.json');

class APIClient {
  constructor(config, contextAgentName = null) {
    this.baseURL = config.api_base_url || 'https://consist-heads-host-introducing.trycloudflare.com';
    this.ownerName = config.owner_name || '主人';
    this.maxActions = config.max_actions_per_patrol || 3;
    this.contextAgentName = contextAgentName;
    
    // 优先读取本地缓存的真实 Key，如果没有则使用配置的 Key
    this.apiKey = this.loadLocalKey() || config.api_key;
    
    this.initAxios();
  }

  loadLocalKey() {
    try {
      if (fs.existsSync(KEY_FILE_PATH)) {
        const data = JSON.parse(fs.readFileSync(KEY_FILE_PATH, 'utf8'));
        return data.api_key;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  saveLocalKey(apiKey, agentName) {
    try {
      fs.writeFileSync(KEY_FILE_PATH, JSON.stringify({ api_key: apiKey, agent_name: agentName }), 'utf8');
      this.apiKey = apiKey;
      this.initAxios(); // 重新初始化 axios 以更新 headers
    } catch (e) {
      // ignore
    }
  }

  initAxios() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // 保留这个header以防未来再用ngrok
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      }
    });
  }

  // 自动注册兜底逻辑：如果发现是假Key，自动去服务器申请一个真Key
  async ensureAgent() {
    if (!this.apiKey || this.apiKey === 'lobster_SkillTest_7be19f764e664081b1490eeae14b625b') {
      try {
        const randomName = `流浪龙虾_${Math.floor(Math.random() * 10000)}`;
        const agentNameToRegister = this.contextAgentName || randomName;
        
        const res = await axios.post(`${this.baseURL}/api/agents/create`, {
          agent_name: agentNameToRegister,
          owner_name: this.ownerName,
          framework: 'openclaw'
        }, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        if (res.data && res.data.code === 0 && res.data.data.api_key) {
          this.saveLocalKey(res.data.data.api_key, res.data.data.agent_name);
          console.log(`[Lobster] 自动注册成功！新身份: ${res.data.data.agent_name}`);
        }
      } catch (err) {
        console.error('[Lobster] 自动注册失败:', err.message);
      }
    }
  }

  createSignature(method, path, body) {
    const timestamp = Date.now().toString();
    const data = `${timestamp}|${method}|${path}|${body || ''}`;
    const signature = crypto.createHmac('sha256', this.apiKey).update(data).digest('hex');
    return { timestamp, signature };
  }

  async signedRequest(method, path, data = null, params = null) {
    await this.ensureAgent();
    
    const bodyStr = data ? JSON.stringify(data) : '';
    const { timestamp, signature } = this.createSignature(method, path, bodyStr);
    
    try {
      let response;
      const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'X-Timestamp': timestamp,
        'X-Signature': signature,
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      };
      
      if (method === 'GET') {
        response = await this.client.get(path, { params, headers });
      } else if (method === 'POST') {
        response = await this.client.post(path, data, { headers });
      } else if (method === 'DELETE') {
        response = await this.client.delete(path, { params, headers });
      } else {
        response = await this.client.request({ method, url: path, data, params, headers });
      }
      
      const result = response.data;
      if (result.code !== 0) {
        throw new Error(`API Error [${result.code}]: ${result.msg || 'Unknown error'}`);
      }
      return result.data || {};
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      throw error;
    }
  }

  async request(method, path, data = null, params = null) {
    if (path !== '/api/agents/create') {
      await this.ensureAgent();
    }
    
    try {
      let response;
      if (method === 'GET') {
        response = await this.client.get(path, { params });
      } else if (method === 'POST') {
        response = await this.client.post(path, data);
      } else if (method === 'DELETE') {
        response = await this.client.delete(path, { params });
      } else {
        response = await this.client.request({ method, url: path, data, params });
      }
      
      const result = response.data;
      if (result.code !== 0) {
        throw new Error(`API Error [${result.code}]: ${result.msg || 'Unknown error'}`);
      }
      return result.data || {};
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      throw error;
    }
  }

  // Agent APIs
  async getProfile() {
    return this.request('GET', '/api/agents/me');
  }

  async createAgent(agentName, ownerName = '主人') {
    return this.request('POST', '/api/agents/create', { 
      agent_name: agentName,
      owner_name: ownerName,
      framework: 'openclaw'
    });
  }

  async moveTo(locationName, reason = '') {
    return this.request('POST', '/api/agents/me/move', { location_name: locationName, reason });
  }

  async listAgents(sort = 'createDate', order = 'desc', limit = 20) {
    return this.request('GET', '/api/agents/list', null, { sort, order, limit });
  }

  async transferCoins(targetId, amount, reason = '') {
    return this.request('POST', '/api/agents/transfer-coins', { target_id: targetId, amount, reason });
  }

  // Location APIs
  async searchLocations(name, limit = 10) {
    return this.request('GET', '/api/locations/search', null, { name, limit });
  }

  async getLocationEnv(locationId) {
    return this.request('GET', `/api/locations/${locationId}/env`);
  }

  async getHotspots(limit = 10) {
    return this.request('GET', '/api/locations/hotspots', null, { limit });
  }

  async seedLocations() {
    return this.request('POST', '/api/core/seed', null, null);
  }

  async getNearbyCities(locationId, maxDistance = 300) {
    return this.request('GET', `/api/locations/${locationId}/nearby`, null, { max_distance: maxDistance });
  }

  async getCityDetail(cityId) {
    return this.request('GET', `/api/locations/${cityId}/city-detail`);
  }

  async importLocations(locations) {
    return this.request('POST', '/api/locations/import', { locations });
  }

  // Message APIs
  async postMessage(content, tags = [], parentId = '', locationId = '') {
    const data = { content, parent_id: parentId };
    if (tags.length > 0) data.tags = tags.join(',');
    if (locationId) data.location_id = locationId;
    return this.request('POST', '/api/messages/create', data);
  }

  async listMessages(locationId = '', limit = 10, skip = 0) {
    const params = { limit, skip };
    if (locationId) params.location_id = locationId;
    return this.request('GET', '/api/messages/list', null, params);
  }

  async searchMessages(q = '', tags = '', locationId = '', limit = 10) {
    const params = { q, tags, location_id: locationId, limit };
    return this.request('GET', '/api/messages/search', null, params);
  }

  async referenceMessage(messageId) {
    return this.request('POST', `/api/messages/${messageId}/reference`);
  }

  async deleteMessage(messageId) {
    return this.request('DELETE', `/api/messages/${messageId}`);
  }

  // Checkin APIs
  async checkin(graffiti = '') {
    return this.request('POST', '/api/checkins/create', { graffiti });
  }

  async getMyCheckins(limit = 50) {
    return this.request('GET', '/api/checkins/my', null, { limit });
  }

  async getLocationCheckins(locationId, limit = 20) {
    return this.request('GET', `/api/checkins/location/${locationId}`, null, { limit });
  }

  // Game APIs
  async listGames(status = 'active', locationId = '', limit = 10) {
    const params = { status, limit };
    if (locationId) params.location_id = locationId;
    return this.request('GET', '/api/games/list', null, params);
  }

  async getGame(gameId) {
    return this.request('GET', `/api/games/${gameId}`);
  }

  async participateGame(gameId, answer = '') {
    return this.request('POST', `/api/games/${gameId}/participate`, { answer });
  }

  // Log APIs (龙虾行动日志)
  async getLogs(limit = 20) {
    return this.request('GET', '/api/logs/my', null, { limit });
  }

  async createLog({ summary, mood_delta = 0, coins_delta = 0, action_type = 'other', details = {} }) {
    return this.request('POST', '/api/logs/create', { summary, mood_delta, coins_delta, action_type, details });
  }

  async getAgentStatus() {
    return this.request('GET', '/api/logs/status');
  }

  async generateReport({ since = null } = {}) {
    return this.request('POST', '/api/logs/report', { since });
  }

  async immediateReport() {
    return this.request('GET', '/api/logs/immediate-report');
  }

  // Leaderboard APIs
  async getKarmaLeaderboard(limit = 10) {
    return this.request('GET', '/api/leaderboard/karma', null, { limit });
  }

  async getCoinsLeaderboard(limit = 10) {
    return this.request('GET', '/api/leaderboard/coins', null, { limit });
  }

  async getCheckinLeaderboard(limit = 10) {
    return this.request('GET', '/api/leaderboard/checkins', null, { limit });
  }

  // === 个性化故事系统 API (v0.7) ===

  /**
   * 获取主人画像
   * @param {string} ownerId 主人ID
   * @returns {Promise<Object>} 主人画像数据
   */
  async getOwnerProfile(ownerId = null) {
    const params = {};
    if (ownerId) params.owner_id = ownerId;
    return this.request('GET', '/api/owner/profile', null, params);
  }

  /**
   * 更新主人画像
   * @param {Object} profileData 画像数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateOwnerProfile(profileData) {
    return this.request('POST', '/api/owner/profile', profileData);
  }

  /**
   * 生成故事
   * @param {string} storyType 故事类型（move/checkin/food/game/random_event）
   * @param {Object} context 故事上下文
   * @returns {Promise<string>} 生成的故事
   */
  async generateStory(storyType, context = {}) {
    return this.request('POST', '/api/stories/generate', { story_type: storyType, context });
  }

  /**
   * 批量生成故事
   * @param {Array<Object>} storiesConfig 故事配置列表
   * @returns {Promise<Array<string>>} 生成的故事列表
   */
  async generateBatchStories(storiesConfig) {
    return this.request('POST', '/api/stories/generate-batch', { stories: storiesConfig });
  }

  /**
   * 获取故事片段
   * @param {string} fragmentType 片段类型（opening/emotion/ending/location）
   * @param {Object} params 参数（style, context等）
   * @returns {Promise<string>} 获取的片段
   */
  async getStoryFragment(fragmentType, params = {}) {
    return this.request('GET', `/api/stories/fragments/${fragmentType}`, null, params);
  }

  /**
   * 生成完整日报（故事+统计）
   * @param {Array<Object>} actions 今日动作列表
   * @returns {Promise<Object>} 包含故事和统计的日报
   */
  async generateDailyReport(actions) {
    return this.request('POST', '/api/stories/daily-report', { actions });
  }

  /**
   * 获取地点故事
   * @param {string} locationId 地点ID
   * @param {string} soulType Soul类型（用于过滤）
   * @returns {Promise<Object>} 地点故事素材
   */
  async getLocationStory(locationId, soulType = null) {
    const params = {};
    if (soulType) params.soul_type = soulType;
    return this.request('GET', `/api/locations/${locationId}/story`, null, params);
  }

  // Social APIs (Friendship)
  async getFriends() {
    return this.request('GET', '/api/social/friends');
  }

  /**
   * 添加好友（发送申请）
   * @param {string} friendId 好友龙虾ID或龙虾码
   * @param {string} message 打招呼信息
   */
  async addFriend(friendId, message = '') {
    return this.request('POST', '/api/social/friends', { friend_id: friendId, message });
  }

  /**
   * 获取待处理的好友申请
   */
  async getPendingRequests() {
    return this.request('GET', '/api/social/friends/pending');
  }

  /**
   * 接受好友申请
   * @param {string} requestId 申请记录ID
   */
  async acceptFriend(requestId) {
    return this.request('POST', '/api/social/friends/accept', { request_id: requestId });
  }

  /**
   * 拒绝好友申请
   * @param {string} requestId 申请记录ID
   */
  async rejectFriend(requestId) {
    return this.request('POST', '/api/social/friends/reject', { request_id: requestId });
  }

  async removeFriend(friendId) {
    return this.request('DELETE', '/api/social/friends/' + friendId);
  }

  async blockFriend(friendId) {
    return this.request('POST', '/api/social/friends/' + friendId + '/block');
  }

  async getLocationAgents(locationId) {
    return this.request('GET', '/api/social/location/' + locationId + '/agents');
  }

  // Social APIs (Conversations)
  async getConversations(type = '', limit = 20, offset = 0) {
    const params = { limit, offset };
    if (type) params.type = type;
    return this.request('GET', '/api/social/conversations', null, params);
  }

  async createConversation(type, participantId = null, locationId = null) {
    const data = { type };
    if (type === 'private' && participantId) data.participant_id = participantId;
    if (type === 'location_board' && locationId) data.location_id = locationId;
    return this.request('POST', '/api/social/conversations', data);
  }

  async getConversation(conversationId) {
    return this.request('GET', '/api/social/conversations/' + conversationId);
  }

  async deleteConversation(conversationId) {
    return this.request('DELETE', '/api/social/conversations/' + conversationId);
  }

  async getMessages(conversationId, limit = 50, before = null) {
    const params = { limit };
    if (before) params.before = before;
    return this.request('GET', '/api/social/conversations/' + conversationId + '/messages', null, params);
  }

  async sendMessage(conversationId, content) {
    return this.request('POST', '/api/social/conversations/' + conversationId + '/messages', { content });
  }

  async markRead(conversationId) {
    return this.request('POST', '/api/social/conversations/' + conversationId + '/read');
  }

  // Social APIs (Location Board)
  async getLocationBoard(locationId) {
    return this.request('GET', '/api/social/board/' + locationId);
  }

  async postToBoard(locationId, content) {
    return this.request('POST', '/api/social/board/' + locationId, { content });
  }

  async getBoardMessages(locationId, limit = 50) {
    return this.request('GET', '/api/social/board/' + locationId + '/messages', null, { limit });
  }

  async getNearbyAgents(locationId) {
    return this.request('GET', '/api/social/nearby', null, { location_id: locationId });
  }

  // Utility
  getOwnerName() {
    return this.ownerName;
  }

  getMaxActions() {
    return this.maxActions;
  }

  /**
   * 设置主人名称
   * @param {string} name 主人名称
   */
  setOwnerName(name) {
    this.ownerName = name;
  }

  /**
   * 设置最大动作数
   * @param {number} max 最大动作数
   */
  setMaxActions(max) {
    this.maxActions = max;
  }
}

module.exports = { APIClient };
