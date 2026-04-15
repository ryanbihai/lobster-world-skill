/**
 * Story Fragment Loader - 故事片段库加载器
 *
 * 🦞 功能：
 * - 加载和管理故事片段数据
 * - 按风格选择片段（开头、情感、结尾）
 * - 随机彩蛋触发（10%概率）
 * - 地点片段管理
 */

const fs = require('fs');
const path = require('path');

const STORY_STYLES = {
  ARTISTIC: 'artistic',   // 文艺风格
  HUMOROUS: 'humorous',   // 幽默风格
  CONCISE: 'concise',     // 简洁风格
  FORMAL: 'formal',       // 正式风格
  COQUETISH: 'coquetish'  // 撒娇风格
};

const EMOTION_TYPES = {
  HAPPY: 'happy',         // 开心
  SURPRISED: 'surprised',  // 惊讶
  TOUCHED: 'touched',      // 感动
  PROUD: 'proud'          // 得意
};

const ENDING_TYPES = {
  REPORT: 'report',        // 汇报型
  COQUETISH: 'coquetish', // 撒娇型
  INTERACTIVE: 'interactive' // 互动型
};

class StoryFragmentLoader {
  /**
   * @param {Object} config 配置对象
   * @param {string} config.dataPath 片段库文件路径
   * @param {boolean} config.cacheEnabled 是否启用缓存
   */
  constructor(config = {}) {
    this.dataPath = config.dataPath || path.join(__dirname, '../data/story-fragments.json');
    this.cacheEnabled = config.cacheEnabled !== false;
    this.cache = null;
    this.lastLoadTime = null;
  }

  /**
   * 加载片段库
   * @returns {Promise<Object>} 片段库数据
   */
  async load() {
    if (this.cacheEnabled && this.cache) {
      return this.cache;
    }

    try {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      const fragments = JSON.parse(data);
      
      this.cache = fragments;
      this.lastLoadTime = new Date();
      
      return fragments;
    } catch (error) {
      console.error('加载故事片段库失败:', error);
      return this._getDefaultFragments();
    }
  }

  /**
   * 获取默认片段（备用）
   */
  _getDefaultFragments() {
    return {
      openings: {
        artistic: ['主人，你知道吗？', '今天在{location}，我突然想起了一句诗：'],
        humorous: ['主人，如果{location}会说话，它一定会说：', '今日份的冒险故事来啦！'],
        concise: ['主人，向您汇报：', '最新情报：{location}有以下亮点：'],
        formal: ['主人，今日探索报告如下：', '向主人汇报今日行程：'],
        coquetish: ['主人～小七今天发现了超棒的{location}！', '主人！！重要情报！{location}有超好玩的！']
      },
      emotions: {
        happy: ['心情好到飞起～', '今天的运气简直爆棚！'],
        surprised: ['你猜怎么着？', '我都不敢相信自己的眼睛！'],
        touched: ['那一刻，我好像明白了什么', '心里暖暖的'],
        proud: ['主人，我是不是很棒？', '夸我夸我！😎']
      },
      endings: {
        report: ['以上就是今日汇报，请主人过目～', '今日探索完毕，请主人指示！'],
        coquetish: ['主人～小七表现得好不好呀？', '求主人表扬！🥺'],
        interactive: ['主人，你觉得呢？', '主人知道{knowledge}吗？', '主人下次要不要一起来？']
      },
      easter_eggs: [
        '对了，我还遇到了另一只龙虾，它说它认识主人的朋友呢！',
        '悄悄告诉主人，我捡到了一个神秘的漂流瓶……',
        '今天我做了一个梦，梦见主人也来了这里～'
      ]
    };
  }

  /**
   * 获取开头片段
   * @param {string} style 风格类型
   * @param {Object} context 上下文（location等）
   * @returns {string} 开头片段
   */
  async getOpening(style = STORY_STYLES.ARTISTIC, context = {}) {
    const data = await this.load();
    const openings = data.openings[style] || data.openings.artistic;
    
    return this._replaceVariables(
      this._randomPick(openings),
      context
    );
  }

  /**
   * 获取情感片段
   * @param {string} emotionType 情感类型
   * @returns {string} 情感片段
   */
  async getEmotion(emotionType = EMOTION_TYPES.HAPPY) {
    const data = await this.load();
    const emotions = data.emotions[emotionType] || data.emotions.happy;
    
    return this._randomPick(emotions);
  }

  /**
   * 获取结尾片段
   * @param {string} endingType 结尾类型
   * @param {Object} context 上下文
   * @returns {string} 结尾片段
   */
  async getEnding(endingType = ENDING_TYPES.INTERACTIVE, context = {}) {
    const data = await this.load();
    const endings = data.endings[endingType] || data.endings.interactive;
    
    return this._replaceVariables(
      this._randomPick(endings),
      context
    );
  }

  /**
   * 获取随机彩蛋（10%概率）
   * @returns {string|null} 彩蛋内容或null
   */
  async getRandomEasterEgg() {
    const probability = 0.1; // 10%概率
    
    if (Math.random() < probability) {
      const data = await this.load();
      return this._randomPick(data.easter_eggs);
    }
    
    return null;
  }

  /**
   * 获取地点描写片段
   * @param {string} locationType 地点类型
   * @param {Object} context 上下文
   * @returns {string} 地点描写片段
   */
  async getLocationDescription(locationType, context = {}) {
    const data = await this.load();
    const descriptions = data.location_descriptions[locationType] || 
                        data.location_descriptions.default ||
                        ['这里风景很美，主人一定会喜欢的！'];
    
    return this._replaceVariables(
      this._randomPick(descriptions),
      context
    );
  }

  /**
   * 根据主人Soul类型选择风格
   * @param {string} soulType Soul类型
   * @returns {string} 推荐的风格类型
   */
  getStyleBySoulType(soulType) {
    const styleMap = {
      'artistic_youth': STORY_STYLES.ARTISTIC,
      'business_elite': STORY_STYLES.CONCISE,
      'foodie': STORY_STYLES.HUMOROUS,
      'history_buff': STORY_STYLES.ARTISTIC,
      'photography_lover': STORY_STYLES.ARTISTIC
    };
    
    return styleMap[soulType] || STORY_STYLES.ARTISTIC;
  }

  /**
   * 获取完整的开头片段（支持多种风格）
   * @param {Array<string>} styles 风格数组
   * @param {Object} context 上下文
   * @returns {string} 完整的开头
   */
  async getOpeningMultiple(styles, context = {}) {
    if (!styles || styles.length === 0) {
      styles = [STORY_STYLES.ARTISTIC];
    }
    
    const openings = [];
    for (const style of styles) {
      const opening = await this.getOpening(style, context);
      openings.push(opening);
    }
    
    return openings.join('');
  }

  /**
   * 生成故事片段组合
   * @param {Object} config 配置
   * @param {string} config.soulType Soul类型
   * @param {string} config.emotionType 情感类型
   * @param {string} config.endingType 结尾类型
   * @param {Object} config.context 上下文
   * @returns {Object} 片段组合
   */
  async generateFragmentCombo(config) {
    const {
      soulType = 'artistic_youth',
      emotionType = EMOTION_TYPES.HAPPY,
      endingType = ENDING_TYPES.INTERACTIVE,
      context = {}
    } = config;

    const style = this.getStyleBySoulType(soulType);
    
    return {
      opening: await this.getOpening(style, context),
      emotion: await this.getEmotion(emotionType),
      ending: await this.getEnding(endingType, context),
      easterEgg: await this.getRandomEasterEgg(),
      locationDescription: context.location_type 
        ? await this.getLocationDescription(context.location_type, context)
        : ''
    };
  }

  /**
   * 替换模板变量
   * @param {string} template 模板字符串
   * @param {Object} variables 变量对象
   * @returns {string} 替换后的字符串
   */
  _replaceVariables(template, variables = {}) {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }

  /**
   * 随机选择
   * @param {Array} array 数组
   * @returns {*} 随机元素
   */
  _randomPick(array) {
    if (!array || array.length === 0) {
      return '';
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * 获取所有可用风格
   * @returns {Array<string>} 风格列表
   */
  getAvailableStyles() {
    return Object.values(STORY_STYLES);
  }

  /**
   * 获取所有情感类型
   * @returns {Array<string>} 情感类型列表
   */
  getAvailableEmotions() {
    return Object.values(EMOTION_TYPES);
  }

  /**
   * 获取所有结尾类型
   * @returns {Array<string>} 结尾类型列表
   */
  getAvailableEndings() {
    return Object.values(ENDING_TYPES);
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache = null;
    this.lastLoadTime = null;
  }

  /**
   * 重新加载数据
   * @returns {Promise<Object>} 片段库数据
   */
  async reload() {
    this.clearCache();
    return await this.load();
  }

  /**
   * 获取加载统计
   * @returns {Object} 加载统计信息
   */
  getStats() {
    return {
      cacheEnabled: this.cacheEnabled,
      isLoaded: this.cache !== null,
      lastLoadTime: this.lastLoadTime,
      dataPath: this.dataPath
    };
  }
}

module.exports = {
  StoryFragmentLoader,
  STORY_STYLES,
  EMOTION_TYPES,
  ENDING_TYPES
};
