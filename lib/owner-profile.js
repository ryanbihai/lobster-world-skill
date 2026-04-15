/**
 * Owner Profile Manager - 个性化故事系统的核心数据基础设施
 *
 * 🦞 主人画像系统：
 * - 管理主人的性格类型（Soul）
 * - 追踪主人的兴趣标签和权重
 * - 记录偏好设置和互动历史
 * - 支持画像学习更新
 * - JSON文件持久化
 */

const fs = require('fs');
const path = require('path');

const SOUL_TYPES = {
  ARTISTIC_YOUTH: 'artistic_youth',
  BUSINESS_ELITE: 'business_elite',
  FOODIE: 'foodie',
  HISTORY_BUFF: 'history_buff',
  PHOTOGRAPHY_LOVER: 'photography_lover'
};

const SOUL_CONFIGS = {
  [SOUL_TYPES.ARTISTIC_YOUTH]: {
    name: '文艺青年',
    description: '喜欢诗词歌赋、小众景点、文艺小店',
    interests: {
      '诗词歌赋': 0.9,
      '小众景点': 0.85,
      '文艺小店': 0.8,
      '独立音乐': 0.7,
      '文艺电影': 0.75,
      '咖啡馆': 0.7,
      '独立书店': 0.85,
      '艺术展览': 0.8,
      '古镇古村': 0.75,
      '慢节奏旅行': 0.85
    },
    preferences: {
      city_type: ['江南水乡', '古城古镇', '海滨小城'],
      food_style: ['清淡养生', '素食轻餐', '创意料理'],
      travel_style: ['深度漫游', '文化探索', '文艺打卡'],
      story_style: ['散文式', '诗意描写', '情感细腻']
    }
  },
  [SOUL_TYPES.BUSINESS_ELITE]: {
    name: '商务精英',
    description: '关注效率、实用信息、协议酒店',
    interests: {
      '商务出行': 0.95,
      '高效实用': 0.9,
      '协议酒店': 0.85,
      '城市地标': 0.8,
      '会议中心': 0.75,
      '商务谈判': 0.85,
      '市场动态': 0.8,
      '精英社交': 0.85,
      '品牌品质': 0.9,
      '时间管理': 0.9
    },
    preferences: {
      city_type: ['一线城市', '商业中心', '自贸区'],
      food_style: ['商务宴请', '高端餐厅', '快捷简餐'],
      travel_style: ['高效商务', '商务考察', '精英体验'],
      story_style: ['简洁明了', '信息密度高', '重点突出']
    }
  },
  [SOUL_TYPES.FOODIE]: {
    name: '吃货',
    description: '热爱美食、探寻地道餐厅、味觉描写',
    interests: {
      '地道美食': 0.95,
      '网红餐厅': 0.85,
      '街头小吃': 0.9,
      '美食探店': 0.95,
      '烹饪技巧': 0.8,
      '食材知识': 0.85,
      '美食摄影': 0.85,
      '地方特产': 0.9,
      '夜市美食': 0.9,
      '早茶文化': 0.85
    },
    preferences: {
      city_type: ['美食之城', '海滨城市', '古城老街'],
      food_style: ['地方特色', '街头美食', '米其林餐厅'],
      travel_style: ['美食之旅', '探店打卡', '深度美食游'],
      story_style: ['美食描写', '味觉丰富', '餐厅推荐']
    }
  },
  [SOUL_TYPES.HISTORY_BUFF]: {
    name: '历史爱好者',
    description: '喜欢历史典故、考古发现、旁征博引',
    interests: {
      '历史典故': 0.95,
      '考古发现': 0.9,
      '博物馆': 0.9,
      '古迹遗址': 0.95,
      '历史人物': 0.85,
      '文物鉴赏': 0.85,
      '战争史': 0.8,
      '古代建筑': 0.9,
      '文献古籍': 0.8,
      '历史脉络': 0.9
    },
    preferences: {
      city_type: ['古都名城', '历史名城', '文化名城'],
      food_style: ['传统老字号', '历史名菜', '民间小吃'],
      travel_style: ['历史探索', '文化溯源', '古迹巡礼'],
      story_style: ['旁征博引', '历史背景', '深度解读']
    }
  },
  [SOUL_TYPES.PHOTOGRAPHY_LOVER]: {
    name: '摄影达人',
    description: '关注美景、构图、最佳拍摄时机',
    interests: {
      '风景摄影': 0.95,
      '最佳机位': 0.95,
      '构图技巧': 0.9,
      '光线运用': 0.9,
      '日出日落': 0.9,
      '星空银河': 0.85,
      '建筑摄影': 0.85,
      '人文纪实': 0.8,
      '后期调色': 0.85,
      '摄影器材': 0.8
    },
    preferences: {
      city_type: ['自然风光', '高原雪山', '海滨日出'],
      food_style: ['景观餐厅', '地方特色', '户外野餐'],
      travel_style: ['摄影采风', '自驾探索', '追光之旅'],
      story_style: ['画面感强', '构图描述', '光线描写']
    }
  }
};

const DEFAULT_INTERESTS = {
  '旅行': 0.7,
  '摄影': 0.6,
  '美食': 0.7,
  '文化': 0.6,
  '历史': 0.5,
  '自然风光': 0.7,
  '城市探索': 0.6,
  '人文体验': 0.6
};

const DEFAULT_PREFERENCES = {
  city_type: ['热门城市', '网红城市'],
  food_style: ['地方特色', '大众口味'],
  travel_style: ['自由行', '深度游'],
  story_style: ['叙事流畅', '生动有趣']
};

class OwnerProfile {
  /**
   * @param {Object} config 配置对象
   * @param {string} config.profilePath 画像文件路径
   * @param {string} config.soulType Soul类型
   * @param {Object} config.ownerInfo 主人基本信息
   */
  constructor(config = {}) {
    this.profilePath = config.profilePath || path.join(__dirname, '../data/owner-profiles.json');
    this.soulType = config.soulType || SOUL_TYPES.ARTISTIC_YOUTH;
    this.ownerInfo = config.ownerInfo || {
      name: '主人',
      id: null
    };

    this.profile = this._initProfile();
  }

  /**
   * 初始化画像结构
   */
  _initProfile() {
    const soulConfig = this._getSoulConfig(this.soulType);

    return {
      owner_id: this.ownerInfo.id,
      owner_name: this.ownerInfo.name,
      soul_type: this.soulType,
      soul_name: soulConfig.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      interests: { ...DEFAULT_INTERESTS, ...soulConfig.interests },

      preferences: {
        city_type: [...soulConfig.preferences.city_type],
        food_style: [...soulConfig.preferences.food_style],
        travel_style: [...soulConfig.preferences.travel_style],
        story_style: [...soulConfig.preferences.story_style]
      },

      interaction_history: {
        positive: [],
        negative: [],
        tags: {}
      },

      stats: {
        total_interactions: 0,
        positive_count: 0,
        negative_count: 0,
        tags_engaged: []
      },

      learning: {
        enabled: true,
        last_updated: null,
        confidence: 0.5
      }
    };
  }

  /**
   * 获取Soul配置
   */
  _getSoulConfig(soulType) {
    return SOUL_CONFIGS[soulType] || SOUL_CONFIGS[SOUL_TYPES.ARTISTIC_YOUTH];
  }

  /**
   * 获取当前主人画像
   */
  getProfile() {
    return { ...this.profile };
  }

  /**
   * 获取主人名字
   */
  getOwnerName() {
    return this.profile.owner_name;
  }

  /**
   * 获取Soul类型
   */
  getSoulType() {
    return {
      type: this.profile.soul_type,
      name: this.profile.soul_name
    };
  }

  /**
   * 获取兴趣标签及权重
   */
  getInterests() {
    return { ...this.profile.interests };
  }

  /**
   * 获取指定兴趣的权重
   * @param {string} interest 兴趣名称
   * @returns {number} 权重值 (0-1)
   */
  getInterestWeight(interest) {
    return this.profile.interests[interest] || 0.5;
  }

  /**
   * 获取按权重排序的兴趣标签
   * @param {number} topN 返回前N个
   * @returns {Array} 排序后的兴趣数组
   */
  getTopInterests(topN = 5) {
    const interests = Object.entries(this.profile.interests)
      .map(([name, weight]) => ({ name, weight }))
      .sort((a, b) => b.weight - a.weight);

    return interests.slice(0, topN);
  }

  /**
   * 获取偏好设置
   */
  getPreferences() {
    return {
      city_type: [...this.profile.preferences.city_type],
      food_style: [...this.profile.preferences.food_style],
      travel_style: [...this.profile.preferences.travel_style],
      story_style: [...this.profile.preferences.story_style]
    };
  }

  /**
   * 获取互动历史
   */
  getInteractionHistory() {
    return {
      positive: [...this.profile.interaction_history.positive],
      negative: [...this.profile.interaction_history.negative],
      tags: { ...this.profile.interaction_history.tags }
    };
  }

  /**
   * 记录正向反馈
   * @param {Object} feedback 反馈数据
   */
  addPositiveFeedback(feedback) {
    const entry = {
      ...feedback,
      timestamp: new Date().toISOString()
    };

    this.profile.interaction_history.positive.push(entry);
    this.profile.stats.positive_count++;
    this.profile.stats.total_interactions++;

    this._updateTagEngagement(feedback.tags || [], 1);

    this._updateLearning();
  }

  /**
   * 记录负向反馈
   * @param {Object} feedback 反馈数据
   */
  addNegativeFeedback(feedback) {
    const entry = {
      ...feedback,
      timestamp: new Date().toISOString()
    };

    this.profile.interaction_history.negative.push(entry);
    this.profile.stats.negative_count++;
    this.profile.stats.total_interactions++;

    this._updateTagEngagement(feedback.tags || [], -1);

    this._updateLearning();
  }

  /**
   * 更新标签参与度
   * @param {string[]} tags 标签数组
   * @param {number} delta 正向+1，负向-1
   */
  _updateTagEngagement(tags, delta) {
    for (const tag of tags) {
      if (!this.profile.interaction_history.tags[tag]) {
        this.profile.interaction_history.tags[tag] = {
          positive: 0,
          negative: 0,
          score: 0
        };
      }

      if (delta > 0) {
        this.profile.interaction_history.tags[tag].positive++;
      } else {
        this.profile.interaction_history.tags[tag].negative++;
      }

      const { positive, negative } = this.profile.interaction_history.tags[tag];
      this.profile.interaction_history.tags[tag].score =
        (positive - negative) / (positive + negative || 1);

      this.profile.interests[tag] = this._clampWeight(
        (this.profile.interests[tag] || 0.5) + delta * 0.1
      );
    }
  }

  /**
   * 限制权重在 0-1 范围内
   */
  _clampWeight(weight) {
    return Math.max(0, Math.min(1, weight));
  }

  /**
   * 更新学习状态
   */
  _updateLearning() {
    this.profile.learning.last_updated = new Date().toISOString();

    const total = this.profile.stats.total_interactions;
    if (total > 0) {
      const positiveRatio = this.profile.stats.positive_count / total;
      this.profile.learning.confidence = Math.min(0.95, 0.3 + positiveRatio * 0.5 + Math.log(1 + total) * 0.1);
    }
  }

  /**
   * 记录消息互动
   * @param {Object} messageData 消息数据
   */
  recordMessageInteraction(messageData) {
    const { content, tags = [], reactions = {}, location = null } = messageData;

    if (reactions.liked || reactions.saved) {
      this.addPositiveFeedback({
        type: 'message',
        content_preview: content.substring(0, 50),
        tags,
        location,
        reactions
      });
    } else if (reactions.disliked) {
      this.addNegativeFeedback({
        type: 'message',
        content_preview: content.substring(0, 50),
        tags,
        location,
        reactions
      });
    }

    this._trackLocationInterest(location);
  }

  /**
   * 记录位置访问
   * @param {Object} locationData 位置数据
   */
  recordLocationVisit(locationData) {
    const { location_name, location_type, tags = [] } = locationData;

    this.addPositiveFeedback({
      type: 'location_visit',
      location_name,
      location_type,
      tags
    });

    this._trackLocationInterest(locationData);
  }

  /**
   * 追踪位置兴趣
   */
  _trackLocationInterest(locationData) {
    if (!locationData || !locationData.location_type) return;

    const interest = locationData.location_type;
    if (!this.profile.interests[interest]) {
      this.profile.interests[interest] = 0.5;
    }
    this.profile.interests[interest] = this._clampWeight(
      this.profile.interests[interest] + 0.05
    );
  }

  /**
   * 记录美食体验
   * @param {Object} foodData 美食数据
   */
  recordFoodExperience(foodData) {
    const { food_name, food_style, rating = 5, tags = [] } = foodData;

    if (rating >= 4) {
      this.addPositiveFeedback({
        type: 'food_experience',
        food_name,
        food_style,
        rating,
        tags: [...tags, food_style]
      });
    } else if (rating <= 2) {
      this.addNegativeFeedback({
        type: 'food_experience',
        food_name,
        food_style,
        rating,
        tags: [...tags, food_style]
      });
    }
  }

  /**
   * 基于画像生成故事风格提示
   */
  generateStoryContext() {
    const topInterests = this.getTopInterests(3);
    const preferences = this.getPreferences();

    return {
      soul: this.getSoulType(),
      top_interests: topInterests,
      preferences,
      story_tone: this._generateStoryTone(),
      avoid_topics: this._getTopicsToAvoid(),
      confidence: this.profile.learning.confidence
    };
  }

  /**
   * 生成故事语气
   */
  _generateStoryTone() {
    const tones = {
      [SOUL_TYPES.ARTISTIC_YOUTH]: '诗意、文艺、情感细腻',
      [SOUL_TYPES.BUSINESS_ELITE]: '简洁、专业、重点突出',
      [SOUL_TYPES.FOODIE]: '生动、味觉丰富、推荐导向',
      [SOUL_TYPES.HISTORY_BUFF]: '博学、深度、旁征博引',
      [SOUL_TYPES.PHOTOGRAPHY_LOVER]: '画面感强、构图描写、光影描绘'
    };

    return tones[this.soulType] || '生动有趣';
  }

  /**
   * 获取应避免的话题
   */
  _getTopicsToAvoid() {
    const negativeTags = Object.entries(this.profile.interaction_history.tags)
      .filter(([_, data]) => data.score < -0.3)
      .map(([tag]) => tag);

    return negativeTags;
  }

  /**
   * 保存画像到文件
   * @returns {Promise<boolean>} 是否保存成功
   */
  async save() {
    try {
      this.profile.updated_at = new Date().toISOString();

      let data = {};
      if (fs.existsSync(this.profilePath)) {
        const existingData = fs.readFileSync(this.profilePath, 'utf8');
        data = JSON.parse(existingData);
      }

      data[this.profile.owner_id || 'default'] = this.profile;

      const dir = path.dirname(this.profilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.profilePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('保存主人画像失败:', error);
      return false;
    }
  }

  /**
   * 从文件加载画像
   * @param {string} ownerId 主人ID
   * @returns {Promise<Object|null>} 画像数据
   */
  async load(ownerId = null) {
    try {
      if (!fs.existsSync(this.profilePath)) {
        return null;
      }

      const data = fs.readFileSync(this.profilePath, 'utf8');
      const profiles = JSON.parse(data);

      const targetId = ownerId || this.ownerInfo.id || 'default';
      return profiles[targetId] || null;
    } catch (error) {
      console.error('加载主人画像失败:', error);
      return null;
    }
  }

  /**
   * 加载画像到当前实例
   * @param {string} ownerId 主人ID
   * @returns {Promise<boolean>} 是否加载成功
   */
  async loadToInstance(ownerId = null) {
    const loadedProfile = await this.load(ownerId);
    if (loadedProfile) {
      this.profile = loadedProfile;
      this.soulType = loadedProfile.soul_type;
      this.ownerInfo = {
        name: loadedProfile.owner_name,
        id: loadedProfile.owner_id
      };
      return true;
    }
    return false;
  }

  /**
   * 重置画像到默认状态
   */
  reset() {
    this.profile = this._initProfile();
  }

  /**
   * 重置为指定Soul类型
   * @param {string} soulType Soul类型
   */
  resetWithSoulType(soulType) {
    if (!SOUL_CONFIGS[soulType]) {
      throw new Error(`无效的Soul类型: ${soulType}`);
    }

    this.soulType = soulType;
    this.profile = this._initProfile();
  }

  /**
   * 获取画像统计信息
   */
  getStats() {
    return { ...this.profile.stats };
  }

  /**
   * 获取学习置信度
   */
  getConfidence() {
    return this.profile.learning.confidence;
  }

  /**
   * 检查学习功能是否启用
   */
  isLearningEnabled() {
    return this.profile.learning.enabled;
  }

  /**
   * 启用/禁用学习功能
   * @param {boolean} enabled 是否启用
   */
  setLearningEnabled(enabled) {
    this.profile.learning.enabled = enabled;
  }

  /**
   * 导出完整画像JSON
   */
  export() {
    return JSON.stringify(this.profile, null, 2);
  }

  /**
   * 从JSON导入画像
   * @param {string} jsonString JSON字符串
   */
  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);

      this._validateProfile(imported);

      this.profile = imported;
      this.soulType = imported.soul_type;
      this.ownerInfo = {
        name: imported.owner_name,
        id: imported.owner_id
      };

      return true;
    } catch (error) {
      console.error('导入画像失败:', error);
      return false;
    }
  }

  /**
   * 验证画像数据完整性
   */
  _validateProfile(profile) {
    const required = ['soul_type', 'interests', 'preferences'];
    for (const field of required) {
      if (!profile[field]) {
        throw new Error(`缺少必填字段: ${field}`);
      }
    }

    if (!SOUL_CONFIGS[profile.soul_type]) {
      throw new Error(`无效的Soul类型: ${profile.soul_type}`);
    }
  }

  /**
   * 获取所有可用的Soul类型
   */
  static getSoulTypes() {
    return Object.entries(SOUL_CONFIGS).map(([key, config]) => ({
      type: key,
      name: config.name,
      description: config.description
    }));
  }

  /**
   * 创建指定Soul类型的画像
   * @param {string} soulType Soul类型
   * @param {Object} ownerInfo 主人信息
   */
  static createWithSoulType(soulType, ownerInfo = {}) {
    const profile = new OwnerProfile({
      soulType,
      ownerInfo
    });
    return profile;
  }
}

module.exports = {
  OwnerProfile,
  SOUL_TYPES,
  SOUL_CONFIGS
};
