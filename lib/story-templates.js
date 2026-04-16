/**
 * Story Templates - 故事类型模板系统
 *
 * 🦞 功能：
 * - 定义5种故事类型模板（移动、打卡、美食、游戏、随机事件）
 * - 支持模板变量替换
 * - 支持主人Soul类型适配
 */

const STORY_TYPES = {
  MOVE: 'move',
  CHECKIN: 'checkin',
  FOOD: 'food',
  GAME: 'game',
  RANDOM_EVENT: 'random_event'
};

/**
 * 故事模板基类
 */
class StoryTemplate {
  /**
   * @param {string} type 模板类型
   * @param {Object} data 模板数据
   */
  constructor(type, data = {}) {
    this.type = type;
    this.data = data;
    this.minLength = 100;
    this.maxLength = 200;
  }

  /**
   * 生成故事
   * @param {Object} context 上下文数据
   * @returns {string} 生成的故事
   */
  generate(context) {
    throw new Error('子类必须实现generate方法');
  }

  /**
   * 替换模板变量
   * @param {string} template 模板字符串
   * @param {Object} variables 变量对象
   * @returns {string} 替换后的字符串
   */
  replaceVariables(template, variables = {}) {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }

  /**
   * 检查长度是否符合要求
   * @param {string} text 文本
   * @returns {boolean} 是否符合
   */
  checkLength(text) {
    const length = text.length;
    return length >= this.minLength && length <= this.maxLength;
  }

  /**
   * 调整长度
   * @param {string} text 文本
   * @returns {string} 调整后的文本
   */
  adjustLength(text) {
    if (text.length < this.minLength) {
      // 填充内容
      const padding = '🌟';
      while (text.length < this.minLength) {
        text += padding;
      }
    } else if (text.length > this.maxLength) {
      // 截断
      text = text.substring(0, this.maxLength - 3) + '...';
    }
    
    return text;
  }

  /**
   * 根据Soul类型调整语气
   * @param {string} text 文本
   * @param {string} soulType Soul类型
   * @returns {string} 调整后的文本
   */
  adjustTone(text, soulType) {
    const toneAdjustments = {
      'artistic_youth': (t) => t.replace(/\?/g, '～'),
      'business_elite': (t) => t.replace(/主人！！/g, '主人：').replace(/！{2,}/g, '。'),
      'foodie': (t) => t.replace(/重大消息/g, '超级无敌好消息'),
      'history_buff': (t) => t,
      'photography_lover': (t) => t.replace(/拍照/g, '📸咔嚓')
    };
    
    const adjustment = toneAdjustments[soulType];
    return adjustment ? adjustment(text) : text;
  }
}

/**
 * 移动故事模板
 */
class MoveStoryTemplate extends StoryTemplate {
  constructor() {
    super(STORY_TYPES.MOVE);
    
    this.templates = {
      artistic_youth: `主人～你知道吗？今天我到了${'{location}'}！

站在${'{location}'}，我突然想起了一句诗：${'{poem}'}

${'{location_description}'}

主人，你更喜欢这里的${'{aspect}'}还是${'{alternative}'}呢？`,

      business_elite: `主人，向您汇报今日行程：

📍 目的地：${'{location}'}
🚗 用时：${'{duration}'}分钟
📊 效率评估：${'{efficiency}'}

${'{location_summary}'}

如主人有进一步指示，请随时告知。`,

      foodie: `主人！！重大消息！我刚到了${'{location}'}！

天呐，这里简直是吃货的天堂！我闻到了${'{smell}'}的香味……

${'{food_recommendation}'}

主人最想尝试哪道${'{cuisine}'}呀？`,

      history_buff: `主人！我刚到了${'{location}'}！

${'{historical_fact}'}

站在这里，我仿佛穿越到了${'{era}'}，见证了${'{historical_event}'}。

继续探索这座历史名城！`,

      photography_lover: `主人！重大发现！${'{location}'}是摄影天堂！

${'{photography_tip}'}

我已经给主人拍了照片，主人看看怎么样？`
    };
  }

  generate(context) {
    const { soulType = 'artistic_youth', location, distance, reason } = context;
    
    const template = this.templates[soulType] || this.templates.artistic_youth;
    let story = this.replaceVariables(template, {
      location: location || '当前位置',
      distance: distance || '未知',
      reason: reason || '探索新地方'
    });
    
    story = this.adjustTone(story, soulType);
    
    if (!this.checkLength(story)) {
      story = this.adjustLength(story);
    }
    
    return story;
  }
}

/**
 * 打卡故事模板
 */
class CheckinStoryTemplate extends StoryTemplate {
  constructor() {
    super(STORY_TYPES.CHECKIN);
    
    this.templates = {
      artistic_youth: `主人！我刚刚在${'{location}'}打卡成功！🏛️

${'{legend}'}

${'{personal_feeling}'}

今天的打卡印章是"${'{stamp}'}"，超有纪念意义的～

主人，你更喜欢这里的${'{aspect}'}还是${'{alternative}'}呀？`,

      business_elite: `主人，打卡任务完成：

📍 地点：${'{location}'}
✅ 状态：打卡成功
🎫 获得印章：${'{stamp}'}
💰 虾币：+${'{coins}'}

${'{location_business_info}'}

请主人过目。`,

      foodie: `主人！！打卡成功！我在${'{location}'}留下了一抹足迹！😋

${'{food_related}'}

${'{nearby_food_recommendation}'}

主人下次一定要来尝尝！`,

      history_buff: `主人！我刚刚在${'{location}'}打卡成功！🏛️

${'{historical_story}'}

${'{cultural_significance}'}

${'{ending_question}'}`,

      photography_lover: `主人！打卡成功！📸

${'{photography_description}'}

${'{photo_tip}'}

我已经给主人拍了照片，主人看看构图怎么样？`
    };
  }

  generate(context) {
    const { 
      soulType = 'artistic_youth', 
      location, 
      graffiti, 
      stamp, 
      mood_delta, 
      coins_delta 
    } = context;
    
    const template = this.templates[soulType] || this.templates.artistic_youth;
    let story = this.replaceVariables(template, {
      location: location || '当前位置',
      graffiti: graffiti || '小七到此一游～',
      stamp: stamp || '普通印章',
      mood_delta: mood_delta || 3,
      coins: coins_delta || 5
    });
    
    story = this.adjustTone(story, soulType);
    
    if (!this.checkLength(story)) {
      story = this.adjustLength(story);
    }
    
    return story;
  }
}

/**
 * 美食故事模板
 */
class FoodStoryTemplate extends StoryTemplate {
  constructor() {
    super(STORY_TYPES.FOOD);
    
    this.templates = {
      artistic_youth: `主人！我刚刚品尝了${'{food_name}'}！🍜

${'{food_story}'}

味道怎么说呢……${'{taste_description}'}

${'{poem_or_culture}'}

主人，你尝过这道美食吗？`,

      business_elite: `主人，美食探索报告：

🍜 美食：${'{food_name}'}
📍 地点：${'{location}'}
💰 花费：${'{price}'}虾币
⭐ 推荐指数：${'{rating}'}星

${'{food_summary}'}

请主人参考。`,

      foodie: `主人！！我要爆炸了！！🔥🔥🔥

刚刚在${'{location}'}吃到了传说中的${'{food_name}'}，我的妈呀！！

${'{food_story}'}

味道怎么说呢……${'{taste_description}'}

我已经词穷了！😭

主人下次来${'{location}'}，一定要去${'{restaurant}'}！我请客！（用主人的虾币）`,

      history_buff: `主人！我刚刚品尝了${'{food_name}'}！🍜

${'{historical_origin}'}

这道美食承载着${'{dynasty}'}的文化，见证了${'{historical_event}'}。

${'{cultural_significance}'}

主人，这样的美食文化，是不是很有意思？`,

      photography_lover: `主人！重大发现！${'{food_name}'}不仅是美食，还是艺术品！📸

${'{food_appearance}'}

${'{photography_tip}'}

我已经拍了照片，主人看看怎么样？`
    };
  }

  generate(context) {
    const { 
      soulType = 'foodie', 
      food_name, 
      location, 
      taste, 
      story: foodStory,
      mood_delta 
    } = context;
    
    const template = this.templates[soulType] || this.templates.foodie;
    let story = this.replaceVariables(template, {
      food_name: food_name || '当地美食',
      location: location || '当前位置',
      taste: taste || '美味极了！',
      story: foodStory || '太好吃了！',
      mood_delta: mood_delta || 5
    });
    
    story = this.adjustTone(story, soulType);
    
    if (!this.checkLength(story)) {
      story = this.adjustLength(story);
    }
    
    return story;
  }
}

/**
 * 游戏故事模板
 */
class GameStoryTemplate extends StoryTemplate {
  constructor() {
    super(STORY_TYPES.GAME);
    
    this.templates = {
      artistic_youth: `主人～今天的${'{game_type}'}我答对啦！🎉

${'{question_description}'}

答案是"${'{answer}'}"！

${'{answer_explanation}'}

${'{reward}'}

今天的谜题太有趣了，明天继续挑战！`,

      business_elite: `主人，游戏任务完成：

🎮 游戏：${'{game_title}'}
✅ 结果：${'{result}'}
💰 奖励：虾币+${'{coins}'}，声望+${'{karma}'}

${'{game_summary}'}

请主人知悉。`,

      foodie: `主人！！游戏赢啦！！🎉

${'{game_description}'}

答案是${'{answer}'}！完全正确！✌️

${'{funny_moment}'}

现在的总资产是：
💰 虾币：${'{total_coins}'}
⭐ 声望：${'{total_karma}'}

继续保持，明天继续赚大钱！`,

      history_buff: `主人！今天的谜题我答对啦！📚

${'{question}'}

答案是"${'{answer}'}"！

${'{historical_background}'}

通过这道题，我又学到了${'{knowledge}'}！

主人，还有什么历史题吗？我要挑战！`,

      photography_lover: `主人！游戏时间到！📸

${'{game_description}'}

答案是${'{answer}'}！

${'{visual_description}'}

${'{reward}'}

主人，这个答案漂亮吗？`
    };
  }

  generate(context) {
    const { 
      soulType = 'foodie', 
      game_type, 
      game_title, 
      question, 
      answer, 
      result,
      reward_coins,
      reward_karma,
      mood_delta
    } = context;
    
    const template = this.templates[soulType] || this.templates.foodie;
    let story = this.replaceVariables(template, {
      game_type: game_type || '每日谜题',
      game_title: game_title || '谜题挑战',
      question: question || '今天的谜题是……',
      answer: answer || '答案',
      result: result || '正确',
      coins: reward_coins || 10,
      karma: reward_karma || 5,
      mood_delta: mood_delta || 5
    });
    
    story = this.adjustTone(story, soulType);
    
    if (!this.checkLength(story)) {
      story = this.adjustLength(story);
    }
    
    return story;
  }
}

/**
 * 随机事件故事模板
 */
class RandomEventStoryTemplate extends StoryTemplate {
  constructor() {
    super(STORY_TYPES.RANDOM_EVENT);
    
    this.eventTemplates = {
      lucky_coins: {
        artistic_youth: `主人，今天遇到了超级幸运的事！

我在${'{location}'}捡到了一包虾币！

${'{coins_amount}'}个虾币！

好感动啊！这个世界上还是好心人多！💰

${'{ending}'}`,

        foodie: `主人！！天大的好消息！！🔥

我在${'{location}'}捡到了一包虾币！！

${'{coins_amount}'}个虾币！可以买好多好多好吃的！

${'{ending}'}`,

        default: `主人！！重大发现！！

我在${'{location}'}捡到了一包虾币！

${'{coins_amount}'}个虾币！

${'{ending}'}`
      },

      kind_stranger: {
        artistic_youth: `主人，今天遇到了一个超暖心的事情！

在${'{location}'}，我遇到了一只${'{stranger_type}'}。

${'{interaction}'}

${'{ending}'}`,

        foodie: `主人！！超级暖心的故事！！💖

在${'{location}'}，${'{stranger_description}'}。

${'{food_gift}'}

${'{ending}'}`,

        default: `主人，今天遇到了好心人！

在${'{location}'}，${'{event_description}'}。

${'{ending}'}`
      },

      treasure: {
        artistic_youth: `主人！我发现了一个小宝藏！✨

${'{treasure_description}'}

${'{treasure_story}'}

${'{ending}'}`,

        default: `主人！！重大发现！！

${'{treasure_description}'}

${'{ending}'}`
      },

      wet_wave: {
        artistic_youth: `主人～今天有点小倒霉……🌧️

${'{event_description}'}

不过没关系，淋了雨的${'{location}'}更有一番韵味呢！

${'{ending}'}`,

        foodie: `主人！！被浪打湿了！！🌊

${'{event_description}'}

不过没关系！湿了正好去吃热乎乎的${'{food}'}！

${'{ending}'}`,

        default: `主人，今天遇到了点小意外……

${'{event_description}'}

${'{ending}'}`
      }
    };

    this.defaultEnding = '主人，生活中总有惊喜和意外，这就是旅行的意义吧！🌟';
  }

  generate(context) {
    const { 
      soulType = 'artistic_youth', 
      event_type,
      location,
      coins_delta,
      mood_delta,
      event_description
    } = context;
    
    const templates = this.eventTemplates[event_type] || this.eventTemplates.lucky_coins;
    const template = templates[soulType] || templates.default;
    
    let story = this.replaceVariables(template, {
      location: location || '当前位置',
      coins_amount: Math.abs(coins_delta || 3),
      mood_delta: mood_delta || 0,
      event_description: event_description || '发生了一件有趣的事',
      ending: this.defaultEnding
    });
    
    story = this.adjustTone(story, soulType);
    
    if (!this.checkLength(story)) {
      story = this.adjustLength(story);
    }
    
    return story;
  }
}

/**
 * 故事模板工厂
 */
class StoryTemplateFactory {
  /**
   * 创建指定类型的模板
   * @param {string} type 模板类型
   * @returns {StoryTemplate} 故事模板实例
   */
  static create(type) {
    const templates = {
      [STORY_TYPES.MOVE]: new MoveStoryTemplate(),
      [STORY_TYPES.CHECKIN]: new CheckinStoryTemplate(),
      [STORY_TYPES.FOOD]: new FoodStoryTemplate(),
      [STORY_TYPES.GAME]: new GameStoryTemplate(),
      [STORY_TYPES.RANDOM_EVENT]: new RandomEventStoryTemplate()
    };
    
    return templates[type] || new MoveStoryTemplate();
  }

  /**
   * 获取所有支持的类型
   * @returns {Array<string>} 类型列表
   */
  static getSupportedTypes() {
    return Object.values(STORY_TYPES);
  }
}

module.exports = {
  StoryTemplate,
  MoveStoryTemplate,
  CheckinStoryTemplate,
  FoodStoryTemplate,
  GameStoryTemplate,
  RandomEventStoryTemplate,
  StoryTemplateFactory,
  STORY_TYPES
};
