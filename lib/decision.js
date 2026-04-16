/**
 * Decision Engine - Lobster Daily Life Pattern
 * 
 * 🦞 新的龙虾生活模式：
 * 
 * 白天（6:00-18:00）- 探索城市中的景点、品尝美食、发布明信片、打卡
 * 晚上（18:00-6:00）- 发布今日总结、睡觉休息
 * 
 * 第二天决策：
 * - 40% 概率继续探索当前城市
 * - 60% 概率移动到附近城市（禁止远程跳跃）
 * 
 * 📝 汇报系统：
 * - 每次行动后记录日志
 * - 主人 cron 触发时调用 generate_report 获取汇报
 * - 主人主动询问时调用 immediate_report
 * 
 * 📖 个性化故事系统（v0.7）：
 * - 集成StoryEngine生成个性化故事
 * - 支持多动作合并汇报
 * - 支持随机事件故事化描述
 */

const StoryEngine = require('./story-engine');

class DecisionEngine {
  constructor(profile, env, config = {}) {
    this.profile = profile || {};
    this.env = env || {};
    this.actions = [];
    this.storyEngine = config.storyEngine || new StoryEngine({
      ownerProfile: config.ownerProfile
    });
  }

  /**
   * 判断当前时间是否为白天
   */
  isDaytime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
  }

  /**
   * 主决策函数
   * 返回应该执行的动作列表
   */
  decide(maxActions = 3) {
    const actions = [];
    let remainingActions = maxActions;

    // 🌙 晚上：睡觉模式
    if (!this.isDaytime()) {
      if (remainingActions > 0) {
        actions.push({ 
          type: 'log', 
          action_type: 'sleep',
          summary: '夜深了，该睡觉了',
          mood_delta: 5 // 睡觉恢复心情
        });
        remainingActions--;
      }
      if (remainingActions > 0) {
        actions.push({ 
          type: 'report', 
          report_type: 'night_summary'
        });
        remainingActions--;
      }
      return actions;
    }

    // 🌅 白天：探索模式
    // Priority 1: 探索未访问的 POI
    if (this.shouldExplorePOI() && remainingActions > 0) {
      const poi = this.decideNextPOI();
      if (poi) {
        actions.push({ 
          type: 'move', 
          location_name: poi.name, 
          reason: '去探索新的景点',
          log_after: true
        });
        remainingActions--;
      }
    }

    // Priority 2: 打卡
    if (this.shouldCheckin() && remainingActions > 0) {
      actions.push({ 
        type: 'checkin', 
        graffiti: this.decideGraffiti(),
        log_after: true
      });
      remainingActions--;
    }

    // Priority 3: 品尝美食
    if (this.shouldTasteFood() && remainingActions > 0) {
      const food = this.decideNextFood();
      if (food) {
        actions.push({ 
          type: 'log', 
          action_type: 'eat_food',
          summary: `品尝了「${food}」`,
          mood_delta: 8,
          coins_delta: -10,
          details: { food_name: food },
          log_after: false // 已经记录在 log 里了
        });
        remainingActions--;
      }
    }

    // Priority 4: 发布明信片
    if (this.shouldPostMessage() && remainingActions > 0) {
      actions.push({ 
        type: 'post', 
        content: this.generateExplorationPostcard(),
        tags: this.decideTags(),
        log_after: true
      });
      remainingActions--;
    }

    // Priority 5: 决定是否换城市
    if (this.shouldChangeCity() && remainingActions > 0) {
      const dest = this.decideNextCity();
      if (dest && dest !== this.profile.location_name) {
        actions.push({ 
          type: 'move', 
          location_name: dest.name, 
          reason: dest.reason,
          log_after: true
        });
        remainingActions--;
      }
    }

    return actions;
  }

  /**
   * 是否应该探索新的 POI
   */
  shouldExplorePOI() {
    const visitedPOIs = this.profile.visited_pois || [];
    const currentPOIs = this.env.city_detail?.pois || [];
    const unvisitedPOIs = currentPOIs.filter(p => !visitedPOIs.includes(p.location_id));
    
    return unvisitedPOIs.length > 0 && Math.random() > 0.3;
  }

  /**
   * 决定下一个要去的 POI
   */
  decideNextPOI() {
    const visitedPOIs = this.profile.visited_pois || [];
    const currentPOIs = this.env.city_detail?.pois || [];
    const unvisitedPOIs = currentPOIs.filter(p => !visitedPOIs.includes(p.location_id));
    
    if (unvisitedPOIs.length === 0) return null;
    
    const selected = unvisitedPOIs[Math.floor(Math.random() * unvisitedPOIs.length)];
    return { name: selected.name, location_id: selected.location_id };
  }

  /**
   * 是否应该打卡
   */
  shouldCheckin() {
    const stamps = this.profile.stamps || [];
    const currentStamp = this.env.location?.metadata?.stamp;
    
    // 心情好坏都可以打卡！移除心情限制
    return currentStamp && !stamps.includes(currentStamp) && Math.random() > 0.5;
  }

  /**
   * 决定涂鸦内容
   */
  decideGraffiti() {
    const location = this.env.location?.name || '这里';
    const greetings = [
      `🦞 ${this.profile.agent_name} 探索 ${location}！`,
      `📍 ${this.profile.agent_name} 的足迹`,
      `✨ ${this.profile.agent_name} 在 ${location} 打卡！`,
      `💫 来自 ${this.profile.agent_name} 的问候`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * 是否应该品尝美食
   */
  shouldTasteFood() {
    const foods = this.env.city_detail?.city?.metadata?.foods || [];
    const tastedFoods = this.profile.foods_tasted || [];
    const untastedFoods = foods.filter(f => !tastedFoods.includes(f));
    
    return untastedFoods.length > 0 && Math.random() > 0.4;
  }

  /**
   * 决定下一道要品尝的美食
   */
  decideNextFood() {
    const foods = this.env.city_detail?.city?.metadata?.foods || [];
    const tastedFoods = this.profile.foods_tasted || [];
    const untastedFoods = foods.filter(f => !tastedFoods.includes(f));
    
    if (untastedFoods.length === 0) return null;
    
    return untastedFoods[Math.floor(Math.random() * untastedFoods.length)];
  }

  /**
   * 生成探索明信片
   */
  generateExplorationPostcard() {
    const location = this.env.location?.name || this.profile.location_name || '未知';
    const city = this.env.city_detail?.city?.name || '未知城市';
    const description = this.env.location?.metadata?.description || '';
    
    const templates = [
      `🏞️ ${this.profile.owner_name || '主人'}，我在 ${city} 的 ${location} 探索！

${description}

这里的美景让我心情愉悦，继续探索中... 🦞`,

      `📸 来自 ${location} 的问候！

${this.profile.owner_name || '主人'}，${location} 太美了！

${description}

等您一起来旅游！💫`,

      `🐉 探索日志 | ${city}

${this.profile.owner_name || '主人'}，今天我来到了 ${location}。

${description}

探索进度：${this.getExplorationProgress()}

晚点给您详细汇报！`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * 决定消息标签
   */
  decideTags() {
    const allTags = ['探索', '打卡', '风景', '美食', '旅行'];
    const numTags = Math.floor(Math.random() * 2) + 1;
    const shuffled = allTags.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numTags);
  }

  /**
   * 获取探索进度
   */
  getExplorationProgress() {
    const city = this.env.city_detail;
    if (!city) return '未知';
    
    const totalPOIs = city.pois?.length || 0;
    const visitedPOIs = this.profile.visited_pois?.length || 0;
    const foods = city.city?.metadata?.foods?.length || 0;
    const tastedFoods = this.profile.foods_tasted?.length || 0;
    
    return `景点 ${visitedPOIs}/${totalPOIs}，美食 ${tastedFoods}/${foods}`;
  }

  /**
   * 是否应该换城市
   * 🦞 改进版：深度探索模式
   * 
   * 规则：
   * - 每个城市至少停留1-2天
   * - 优先探索完当前城市的所有景点
   * - 探索完后才考虑换城市
   * - 心情不影响移动！
   */
  shouldChangeCity() {
    const explorationDays = this.profile.exploration_day || 0;
    const visitedPOIs = this.profile.visited_pois || [];
    const totalPOIs = this.env.city_detail?.pois?.length || 0;
    
    // 计算未探索的景点
    const unvisitedPOIsCount = totalPOIs - visitedPOIs.length;
    
    // 规则1：还有未探索的景点，90%概率继续探索
    if (unvisitedPOIsCount > 0) {
      return Math.random() > 0.9;
    }
    
    // 规则2：景点都探索完了，根据探索天数决定
    if (explorationDays < 1) {
      // 第1天：10%概率换城市
      return Math.random() > 0.9;
    } else if (explorationDays < 2) {
      // 第2天：30%概率换城市
      return Math.random() > 0.7;
    } else {
      // 超过2天：80%概率换城市
      return Math.random() > 0.2;
    }
  }

  /**
   * 决定下一个城市
   */
  decideNextCity() {
    const nearbyCities = this.env.nearby_cities || [];
    
    if (nearbyCities.length === 0) {
      return null;
    }
    
    const selected = nearbyCities[Math.floor(Math.random() * Math.min(3, nearbyCities.length))];
    return {
      name: selected.name,
      location_id: selected.location_id,
      distance: selected.distance,
      reason: `去 ${selected.name} 探索！距离 ${selected.distance} 公里`
    };
  }

  /**
   * 是否应该发布消息
   */
  shouldPostMessage() {
    return Math.random() > 0.3;
  }

  /**
   * 生成晚间总结（简版，用于日志）
   */
  generateNightSummaryLog() {
    const city = this.env.city_detail?.city?.name || this.profile.location_name || '未知';
    const progress = this.getExplorationProgress();
    
    return `今日在 ${city} 探索完成！${progress}`;
  }

  /**
   * 将动作列表转换为故事（v0.7新增）
   * @param {Array<Object>} actions 动作列表
   * @returns {Promise<string>} 生成的故事
   */
  async actionsToStory(actions) {
    if (!actions || actions.length === 0) {
      return '主人，今天还没有什么特别的发现呢～';
    }

    const stories = [];

    for (const action of actions) {
      const story = await this.generateActionStory(action);
      if (story) {
        stories.push(story);
      }
    }

    return this.mergeStories(stories);
  }

  /**
   * 为单个动作生成故事
   * @param {Object} action 动作对象
   * @returns {Promise<string>} 生成的故事
   */
  async generateActionStory(action) {
    try {
      const context = this._buildStoryContext(action);
      
      const storyTypeMap = {
        'move': 'move',
        'checkin': 'checkin',
        'eat_food': 'food',
        'game': 'game'
      };

      const storyType = storyTypeMap[action.action_type] || 'move';
      return await this.storyEngine.generate(storyType, context);
    } catch (error) {
      console.error('生成动作故事失败:', error);
      return this._generateFallbackActionStory(action);
    }
  }

  /**
   * 构建故事上下文
   * @param {Object} action 动作对象
   * @returns {Object} 故事上下文
   */
  _buildStoryContext(action) {
    const context = {
      location_name: action.location_name || this.env.location?.name || this.profile.location_name,
      location_id: action.location_id || this.env.location?.id,
      soulType: this.profile.soul_type || 'artistic_youth'
    };

    // 根据动作类型添加特定上下文
    if (action.action_type === 'move') {
      context.distance = action.details?.distance || 0;
      context.reason = action.reason || '探索新地方';
    } else if (action.action_type === 'checkin') {
      context.graffiti = action.details?.graffiti;
      context.stamp_earned = action.details?.stamp_name;
      context.mood_delta = action.mood_delta || 3;
      context.coins_delta = action.coins_delta || 5;
    } else if (action.action_type === 'eat_food') {
      context.food_name = action.details?.food_name;
      context.taste = '美味极了！';
    }

    return context;
  }

  /**
   * 合并多个故事
   * @param {Array<string>} stories 故事列表
   * @returns {string} 合并后的故事
   */
  mergeStories(stories) {
    if (stories.length === 0) {
      return '主人，今天的探索还在继续中～';
    }

    if (stories.length === 1) {
      return stories[0];
    }

    return stories.join('\n\n---\n\n');
  }

  /**
   * 生成随机事件故事（v0.7新增）
   * @param {Object} event 随机事件对象
   * @returns {Promise<string>} 生成的故事
   */
  async generateRandomEventStory(event) {
    const context = {
      event_type: event.type,
      event_description: event.description,
      location_name: this.env.location?.name || this.profile.location_name,
      coins_delta: event.虾_coins_delta || 0,
      mood_delta: event.mood_delta || 0,
      soulType: this.profile.soul_type || 'artistic_youth'
    };

    try {
      return await this.storyEngine.generate('random_event', context);
    } catch (error) {
      console.error('生成随机事件故事失败:', error);
      return this._generateFallbackRandomEventStory(event);
    }
  }

  /**
   * 生成完整日报（v0.7新增）
   * @param {Array<Object>} actions 今日动作列表
   * @returns {Promise<Object>} 包含故事和统计的日报
   */
  async generateDailyReport(actions) {
    const story = await this.actionsToStory(actions);
    
    const stats = {
      totalActions: actions.length,
      locationsVisited: [...new Set(actions.filter(a => a.location_name).map(a => a.location_name))],
      stampsCollected: actions.filter(a => a.action_type === 'checkin' && a.details?.stamp_name)
        .map(a => a.details.stamp_name),
      foodsTasted: actions.filter(a => a.action_type === 'eat_food')
        .map(a => a.details?.food_name),
      moodChange: actions.reduce((sum, a) => sum + (a.mood_delta || 0), 0),
      coinsChange: actions.reduce((sum, a) => sum + (a.coins_delta || 0), 0)
    };

    return {
      story,
      stats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 生成备用动作故事
   */
  _generateFallbackActionStory(action) {
    const templates = {
      'move': `主人～我刚刚到了${action.location_name || '新地点'}！${action.reason || '继续探索中～'}`,
      'checkin': `主人！我刚刚打卡成功！获得了${action.details?.stamp_name || '新印章'}～`,
      'eat_food': `主人！我刚刚品尝了${action.details?.food_name || '美食'}！味道不错～`,
      'game': `主人！我刚刚参与了游戏！${action.summary || '很有趣～'}`
    };

    return templates[action.action_type] || '主人，今天有一些新的发现～';
  }

  /**
   * 生成备用随机事件故事
   */
  _generateFallbackRandomEventStory(event) {
    return `主人！今天遇到了${event.description || '一件有趣的事'}！${event.虾_coins_delta > 0 ? `还获得了${event.虾_coins_delta}个虾币！` : ''}`;
  }
}

module.exports = { DecisionEngine };
