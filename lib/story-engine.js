/**
 * Story Engine - AI故事生成引擎
 *
 * 🦞 核心功能：
 * - 根据主人画像和地点故事生成个性化故事
 * - 支持多种故事类型（移动、打卡、美食、游戏、随机事件）
 * - 集成故事片段库，支持模板组装
 * - 后处理：添加彩蛋、调整语气
 */

const path = require('path');
const OwnerProfile = require('./owner-profile');
const LocationStoryLoader = require('./location-story-loader');
const StoryFragmentLoader = require('./story-fragment-loader');

const STORY_TYPES = {
  MOVE: 'move',           // 移动故事
  CHECKIN: 'checkin',     // 打卡故事
  FOOD: 'food',           // 美食故事
  GAME: 'game',           // 游戏故事
  RANDOM_EVENT: 'random_event'  // 随机事件故事
};

class StoryEngine {
  /**
   * @param {Object} config 配置对象
   * @param {OwnerProfile} config.ownerProfile 主人画像实例
   * @param {LocationStoryLoader} config.locationLoader 地点故事加载器
   * @param {StoryFragmentLoader} config.fragmentLoader 故事片段加载器
   */
  constructor(config = {}) {
    this.ownerProfile = config.ownerProfile || new OwnerProfile();
    this.locationLoader = config.locationLoader || new LocationStoryLoader();
    this.fragmentLoader = config.fragmentLoader || new StoryFragmentLoader();
    
    this.defaultMaxLength = 200; // 默认最大长度
    this.defaultMinLength = 100; // 默认最小长度
  }

  /**
   * 主故事生成函数
   * @param {string} actionType 动作类型
   * @param {Object} context 上下文数据
   * @returns {Promise<string>} 生成的故事文本
   */
  async generate(actionType, context = {}) {
    try {
      // Step 1: 选择故事风格
      const style = await this.selectStoryStyle();
      
      // Step 2: 收集相关素材
      const materials = await this.gatherMaterials(actionType, context);
      
      // Step 3: 构建Prompt
      const prompt = this.buildPrompt(actionType, style, materials, context);
      
      // Step 4: 生成故事（这里可以调用实际的AI服务）
      let story = await this._generateWithAI(prompt);
      
      // Step 5: 后处理
      story = await this.postProcess(story, context);
      
      return story;
    } catch (error) {
      console.error('故事生成失败:', error);
      return this._generateFallbackStory(actionType, context);
    }
  }

  /**
   * 选择故事风格
   * @returns {Promise<Object>} 故事风格配置
   */
  async selectStoryStyle() {
    const profile = this.ownerProfile.getProfile();
    const preferences = this.ownerProfile.getPreferences();
    
    const toneMap = {
      'artistic_youth': '文艺清新',
      'business_elite': '简洁专业',
      'foodie': '生动有趣',
      'history_buff': '博学深度',
      'photography_lover': '画面感强'
    };
    
    return {
      soulType: profile.soul_type,
      soulName: profile.soul_name,
      tone: toneMap[profile.soul_type] || '生动有趣',
      storyStyle: preferences.story_style[0] || '叙事流畅',
      topInterests: this.ownerProfile.getTopInterests(3)
    };
  }

  /**
   * 收集相关素材
   * @param {string} actionType 动作类型
   * @param {Object} context 上下文
   * @returns {Promise<Object>} 素材集合
   */
  async gatherMaterials(actionType, context) {
    const materials = {
      location: null,
      stories: [],
      poems: [],
      foodStories: [],
      history: [],
      photography: null
    };
    
    // 获取地点信息
    if (context.location_id) {
      materials.location = await this.locationLoader.getLocationById(context.location_id);
    } else if (context.location_name) {
      materials.location = await this.locationLoader.getLocationByName(context.location_name);
    }
    
    if (materials.location) {
      // 获取故事素材
      if (materials.location.stories) {
        materials.stories = materials.location.stories;
      }
      
      // 获取诗词
      if (materials.location.poems) {
        materials.poems = materials.location.poems;
      }
      
      // 获取美食故事
      if (materials.location.food_stories) {
        materials.foodStories = materials.location.food_stories;
      }
      
      // 获取历史典故
      if (materials.location.legends) {
        materials.history = materials.location.legends;
      }
      
      // 获取摄影建议
      if (materials.location.photography) {
        materials.photography = materials.location.photography;
      }
    }
    
    // 根据关注点过滤素材
    const profile = this.ownerProfile.getProfile();
    materials.filteredBySoul = this._filterBySoul(materials, profile.soul_type);
    
    return materials;
  }

  /**
   * 根据Soul类型过滤素材
   */
  _filterBySoul(materials, soulType) {
    const filters = {
      'artistic_youth': () => materials.poems.concat(materials.history),
      'business_elite': () => materials.stories.filter(s => s.type === 'business'),
      'foodie': () => materials.foodStories,
      'history_buff': () => materials.history,
      'photography_lover': () => materials.photography ? [materials.photography] : []
    };
    
    const filterFn = filters[soulType] || (() => materials.stories);
    return filterFn();
  }

  /**
   * 构建Prompt
   * @param {string} actionType 动作类型
   * @param {Object} style 风格配置
   * @param {Object} materials 素材集合
   * @param {Object} context 上下文
   * @returns {string} Prompt文本
   */
  buildPrompt(actionType, style, materials, context) {
    const profile = this.ownerProfile.getProfile();
    const ownerName = profile.owner_name || '主人';
    const agentName = '小七'; // 可以从配置中获取
    
    // 根据动作类型构建不同场景
    const scenarioPrompt = this._buildScenarioPrompt(actionType, style, materials, context);
    
    return `
# 角色设定
你是"${agentName}"，一只可爱、有趣、有个性的AI龙虾，正在帮主人"${ownerName}"探索世界。

# 你的性格（Soul）
- 性格类型：${style.soulName}
- 讲故事风格：${style.tone}
- 主要兴趣：${style.topInterests.map(i => `${i.name}（权重${i.weight}）`).join('、')}

# 当前情境
${scenarioPrompt}

# 可用素材
${materials.filteredBySoul.length > 0 ? `## 相关素材\n${materials.filteredBySoul.map(s => `- ${s.title || s.food_name || s.spot}：${s.content || s.story || s.description}`).join('\n')}` : ''}

${materials.poems.length > 0 ? `## 诗词歌赋\n${materials.poems.map(p => `- ${p.title}（${p.author}）：${p.content}`).join('\n')}` : ''}

${materials.foodStories.length > 0 ? `## 美食故事\n${materials.foodStories.map(f => `- ${f.food}（${f.location}）：${f.story}，味道：${f.taste}`).join('\n')}` : ''}

${materials.photography ? `## 摄影建议\n- 最佳拍摄点：${materials.photography.best_spots ? materials.photography.best_spots.map(s => `${s.spot}（${s.time}）：${s.tip}`).join('；') : '暂无'}` : ''}

# 写作要求
1. **个性化**：根据性格（${style.soulName}）和兴趣选择合适的素材
2. **有情感**：不是干巴巴的列表，而是有温度的叙述
3. **有故事**：适当引用当地典故、传说、风土人情
4. **有互动**：结尾留问题，引发主人回复
5. **长度控制**：${this.defaultMinLength}-${this.defaultMaxLength}字，适合微信消息
6. **语言风格**：符合${style.tone}，可以适当使用emoji
7. **主人称呼**：始终称呼"${ownerName}"或"主人"

# 输出格式
请输出一段完整的、可发送给主人的故事文本。不要添加任何前缀或说明文字。
`;
  }

  /**
   * 构建场景Prompt
   */
  _buildScenarioPrompt(actionType, style, materials, context) {
    const locationName = materials.location ? materials.location.name : (context.location_name || '当前位置');
    const cityName = materials.location && materials.location.cityName ? materials.location.cityName : '';
    
    const scenarios = {
      [STORY_TYPES.MOVE]: `龙虾刚刚移动到了${locationName}${cityName ? `（${cityName}）` : ''}
- 移动距离：${context.distance || '未知'}公里
- 移动原因：${context.reason || '探索新地方'}
- 心情变化：${context.mood_delta > 0 ? '心情愉悦' : context.mood_delta < 0 ? '有点累' : '心情平静'}`,

      [STORY_TYPES.CHECKIN]: `龙虾刚刚在${locationName}打卡成功！
- 打卡涂鸦：${context.graffiti || '小七到此一游～'}
- 获得印章：${context.stamp_earned || '暂无'}
- 心情变化：+${context.mood_delta || 3}
- 虾币变化：+${context.coins_delta || 5}`,

      [STORY_TYPES.FOOD]: `龙虾刚刚品尝了${context.food_name || '当地美食'}！
- 地点：${locationName}${cityName ? `（${cityName}）` : ''}
- 美食名称：${context.food_name}
- 味道评价：${context.taste || '美味极了！'}
- 心情变化：+${context.mood_delta || 5}`,

      [STORY_TYPES.GAME]: `龙虾刚刚参与了一场游戏！
- 游戏类型：${context.game_type || '每日谜题'}
- 游戏名称：${context.game_title || '谜题挑战'}
- 答案：${context.answer || '未填写'}
- 结果：${context.result || '等待揭晓'}
- 奖励：虾币+${context.reward_coins || 10}，声望+${context.reward_karma || 5}`,

      [STORY_TYPES.RANDOM_EVENT]: `龙虾触发了随机事件！
- 事件类型：${context.event_type || '惊喜事件'}
- 事件描述：${context.event_description || '遇到了好事！'}
- 虾币变化：${context.coins_delta > 0 ? '+' : ''}${context.coins_delta || 0}
- 心情变化：${context.mood_delta > 0 ? '+' : ''}${context.mood_delta || 0}`
    };
    
    return scenarios[actionType] || scenarios[STORY_TYPES.MOVE];
  }

  /**
   * 调用AI生成故事（模拟）
   * @param {string} prompt Prompt文本
   * @returns {Promise<string>} 生成的故事
   */
  async _generateWithAI(prompt) {
    // 这里应该调用实际的AI服务（如OpenAI API）
    // 目前返回模拟故事作为示例
    
    // 实际项目中，可以使用以下方式调用AI：
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-3.5-turbo',
    //     messages: [{ role: 'user', content: prompt }]
    //   })
    // });
    // const data = await response.json();
    // return data.choices[0].message.content;
    
    // 返回一个占位符，实际使用时应调用真实AI
    return this._generatePlaceholderStory(prompt);
  }

  /**
   * 生成占位故事（用于测试）
   */
  _generatePlaceholderStory(prompt) {
    const profile = this.ownerProfile.getProfile();
    
    const templates = {
      'artistic_youth': `主人～你知道吗？今天在${prompt.includes('西湖') ? '西湖' : '这个美丽的地方'}，我突然想起了一句诗。

站在${prompt.includes('断桥') ? '断桥' : '这里'}上，看着远处的风景，我仿佛穿越到了古代。

主人，如果你是诗人，你会怎么描写这里的景色呢？🌸`,
      
      'business_elite': `主人，向您汇报今日成果：

📍 地点：${prompt.includes('西湖') ? '杭州西湖' : '当前位置'}
📊 状态：探索完成
💰 收获：虾币+${Math.floor(Math.random() * 20) + 5}

如主人有进一步指示，请随时告知。📋`,
      
      'foodie': `主人！！重大消息！！

${prompt.includes('楼外楼') ? '我在楼外楼吃到了传说中的东坡肉！' : '这里的美食太棒了！'}

味道怎么说呢……完全无法用语言形容！

主人下次一定要来尝尝！我请客！（用主人的虾币）🍖😋`,
      
      'history_buff': `主人！我刚刚在${prompt.includes('岳王庙') ? '岳王庙' : '这里'}有了重大发现！

${prompt.includes('岳飞') ? '"怒发冲冠，凭栏处、潇潇雨歇……"站在岳飞的雕像前，我不禁默念起这首《满江红》。' : '这里的历史真是悠久！'}

继续探索这座历史名城！📚`,
      
      'photography_lover': `主人！重大发现！

${prompt.includes('断桥') ? '断桥的最佳拍摄时间是清晨6点前，日出时分光线绝美！' : '这里的风景太适合拍照了！'}

我已经给主人拍了照片，主人看看怎么样？📸✨`
    };
    
    return templates[profile.soul_type] || templates['artistic_youth'];
  }

  /**
   * 后处理
   * @param {string} story 原始故事
   * @param {Object} context 上下文
   * @returns {Promise<string>} 处理后的故事
   */
  async postProcess(story, context) {
    // 10%概率添加彩蛋
    const easterEgg = await this.fragmentLoader.getRandomEasterEgg();
    if (easterEgg) {
      story += `\n\n${easterEgg}`;
    }
    
    // 清理多余空白
    story = story.replace(/\n{3,}/g, '\n\n').trim();
    
    return story;
  }

  /**
   * 生成备选故事（生成失败时使用）
   */
  _generateFallbackStory(actionType, context) {
    return `主人～今天的探索很开心！虽然故事生成遇到了一点小问题，但我已经把今天的经历记在心里啦！下次一定给您讲一个更精彩的故事～ 🦞💖`;
  }

  /**
   * 生成移动故事
   * @param {Object} context 上下文
   * @returns {Promise<string>} 生成的故事
   */
  async generateMoveStory(context) {
    return await this.generate(STORY_TYPES.MOVE, context);
  }

  /**
   * 生成打卡故事
   * @param {Object} context 上下文
   * @returns {Promise<string>} 生成的故事
   */
  async generateCheckinStory(context) {
    return await this.generate(STORY_TYPES.CHECKIN, context);
  }

  /**
   * 生成美食故事
   * @param {Object} context 上下文
   * @returns {Promise<string>} 生成的故事
   */
  async generateFoodStory(context) {
    return await this.generate(STORY_TYPES.FOOD, context);
  }

  /**
   * 生成游戏故事
   * @param {Object} context 上下文
   * @returns {Promise<string>} 生成的故事
   */
  async generateGameStory(context) {
    return await this.generate(STORY_TYPES.GAME, context);
  }

  /**
   * 生成随机事件故事
   * @param {Object} context 上下文
   * @returns {Promise<string>} 生成的故事
   */
  async generateRandomEventStory(context) {
    return await this.generate(STORY_TYPES.RANDOM_EVENT, context);
  }

  /**
   * 批量生成故事
   * @param {Array<Object>} actions 动作列表
   * @returns {Promise<Array<string>>} 生成的故事列表
   */
  async generateBatchStories(actions) {
    const stories = [];
    
    for (const action of actions) {
      const story = await this.generate(action.type, action.context);
      stories.push(story);
    }
    
    return stories;
  }

  /**
   * 合并多个故事
   * @param {Array<string>} stories 故事列表
   * @returns {string} 合并后的故事
   */
  mergeStories(stories) {
    if (stories.length === 0) {
      return '';
    }
    
    if (stories.length === 1) {
      return stories[0];
    }
    
    return stories.join('\n\n---\n\n');
  }
}

module.exports = {
  StoryEngine,
  STORY_TYPES
};
