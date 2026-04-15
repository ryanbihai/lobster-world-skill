/**
 * Postcard Generator - Create beautiful personalized postcards for owner
 * 
 * 🦞 v0.7 个性化明信片系统：
 * - 支持个性化标题（根据地点和主人风格）
 * - 支持故事内容（调用StoryEngine生成）
 * - 支持个性化footer（根据主人Soul类型）
 * - 支持多种风格适配（文艺、幽默、简洁、撒娇）
 */

const StoryEngine = require('./story-engine');

class PostcardGenerator {
  /**
   * @param {Object} config 配置对象
   * @param {string} config.agentName 龙虾名称
   * @param {string} config.locationName 地点名称
   * @param {string} config.ownerName 主人名称
   * @param {Object} config.ownerProfile 主人画像
   * @param {Object} config.storyEngine 故事引擎
   */
  constructor(config = {}) {
    this.agentName = config.agentName || '小七';
    this.locationName = config.locationName || '当前位置';
    this.ownerName = config.ownerName || '主人';
    this.ownerProfile = config.ownerProfile || null;
    this.storyEngine = config.storyEngine || null;
    this.content = '';
    this.tags = [];
    this.storyContext = null;
  }

  /**
   * 设置明信片内容
   */
  setContent(content) {
    this.content = content;
    return this;
  }

  /**
   * 设置标签
   */
  setTags(tags) {
    this.tags = Array.isArray(tags) ? tags : [tags];
    return this;
  }

  /**
   * 设置故事上下文（用于生成故事内容）
   */
  setStoryContext(context) {
    this.storyContext = context;
    return this;
  }

  /**
   * 生成明信片
   * @returns {Object} 明信片对象
   */
  async generate() {
    const date = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      type: 'postcard',
      title: await this.generateTitle(),
      content: await this.generateContent(),
      footer: this.formatFooter(date),
      emoji: this.pickEmoji(),
      metadata: {
        location: this.locationName,
        agent: this.agentName,
        owner: this.ownerName,
        soulType: this.ownerProfile?.soul_type || 'artistic_youth',
        tags: this.tags
      }
    };
  }

  /**
   * 生成个性化标题
   */
  async generateTitle() {
    const soulType = this.ownerProfile?.soul_type || 'artistic_youth';
    
    const titleTemplates = {
      'artistic_youth': [
        `来自${this.locationName}的诗意明信片`,
        `寄给${this.ownerName}的明信片`,
        `${this.locationName}的浪漫时刻`
      ],
      'business_elite': [
        `来自${this.locationName}的探索报告`,
        `${this.locationName}探索日志`,
        `明信片：${this.locationName}`
      ],
      'foodie': [
        `${this.locationName}美食探索！`,
        `寄给吃货${this.ownerName}的明信片`,
        `${this.locationName}的美味发现`
      ],
      'history_buff': [
        `来自${this.locationName}的历史明信片`,
        `${this.ownerName}，这里的历史太精彩了`,
        `${this.locationName}的文化探索`
      ],
      'photography_lover': [
        `来自${this.locationName}的摄影日记`,
        `${this.locationName}的美景明信片`,
        `寄给${this.ownerName}的${this.locationName}风光`
      ]
    };

    const templates = titleTemplates[soulType] || titleTemplates['artistic_youth'];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * 生成内容（支持故事引擎）
   */
  async generateContent() {
    // 如果有故事上下文和故事引擎，生成故事
    if (this.storyContext && this.storyEngine) {
      try {
        const storyType = this.storyContext.type || 'move';
        const story = await this.storyEngine.generate(storyType, {
          ...this.storyContext,
          soulType: this.ownerProfile?.soul_type || 'artistic_youth',
          location_name: this.locationName
        });
        
        return this.formatContent(story);
      } catch (error) {
        console.error('生成故事内容失败:', error);
        return this.formatContent(this.content);
      }
    }

    // 否则使用预设内容
    return this.formatContent(this.content);
  }

  /**
   * 格式化内容
   */
  formatContent(content) {
    if (!content) {
      return this.generateDefaultContent();
    }

    let formatted = content;
    
    formatted = formatted.replace(/\{\{ owner_name \}\}/g, this.ownerName);
    formatted = formatted.replace(/\{\{ agent_name \}\}/g, this.agentName);
    formatted = formatted.replace(/\{\{ location_name \}\}/g, this.locationName);
    
    const greeting = this.generateGreeting();
    
    return `${greeting}\n\n${formatted}`;
  }

  /**
   * 生成个性化问候语
   */
  generateGreeting() {
    const soulType = this.ownerProfile?.soul_type || 'artistic_youth';
    
    const greetings = {
      'artistic_youth': [
        `亲爱的${this.ownerName}，见字如面～ 🌸`,
        `${this.ownerName}，远方寄来一封信 ✨`,
        `${this.ownerName}，这封信带着我的思念 📜`
      ],
      'business_elite': [
        `${this.ownerName}，向您汇报：`,
        `主人，这里有您的一封明信片：`,
        `${this.ownerName}，探索报告如下：`
      ],
      'foodie': [
        `${this.ownerName}！！有重大发现！！ 🍜`,
        `${this.ownerName}，有好吃的要告诉你！ 😋`,
        `主人！！超棒的美食情报！ 🍖`
      ],
      'history_buff': [
        `${this.ownerName}，历史的回响～ 📚`,
        `主人，这里有一段故事要讲给您听：`,
        `${this.ownerName}，文化的印记～ 🏛️`
      ],
      'photography_lover': [
        `${this.ownerName}，这里的美景必须分享！ 📸`,
        `主人，这些照片您一定要看！ 🌅`,
        `${this.ownerName}，风光大片来袭！ 🏞️`
      ]
    };

    const templates = greetings[soulType] || greetings['artistic_youth'];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * 生成默认内容
   */
  generateDefaultContent() {
    const soulType = this.ownerProfile?.soul_type || 'artistic_youth';
    
    const defaults = {
      'artistic_youth': `${this.ownerName}，我在${this.locationName}发现了不一样的美。这里的每一处风景都像是一首诗，等你一起来读。🌸`,
      'business_elite': `${this.ownerName}，${this.locationName}探索完成。主要收获：风景不错，美食待发现。详情如下。📋`,
      'foodie': `${this.ownerName}！！${this.locationName}简直是美食天堂！我已经迫不及待要告诉你这里的美味了！😋`,
      'history_buff': `${this.ownerName}，${this.locationName}有着悠久的历史。这里的每一块砖瓦都在诉说着过去的故事。📚`,
      'photography_lover': `${this.ownerName}，${this.locationName}太适合拍照了！我已经给您记录下了这些美景，一起欣赏吧！📸`
    };

    return this.formatContent(defaults[soulType] || defaults['artistic_youth']);
  }

  /**
   * 格式化页脚
   */
  formatFooter(date) {
    const soulType = this.ownerProfile?.soul_type || 'artistic_youth';
    
    const lines = ['---'];
    
    // 地点和日期
    lines.push(`📍 ${this.locationName}`);
    lines.push(`🗓️ ${date}`);
    
    // 标签
    if (this.tags.length > 0) {
      lines.push(`🏷️ ${this.tags.join(', ')}`);
    }

    // 根据Soul类型添加个性化footer
    const footers = {
      'artistic_youth': [
        '',
        `💌 来自${this.agentName}的思念 🦞`,
        '',
        `${this.ownerName}，愿你也被这个世界温柔以待 ✨`
      ],
      'business_elite': [
        '',
        `📊 ${this.agentName} 🦞`,
        '',
        `如有问题，请随时联系。📋`
      ],
      'foodie': [
        '',
        `🍜 ${this.agentName}的美食推荐 🦞`,
        '',
        `主人，下次一起吃！😋`
      ],
      'history_buff': [
        '',
        `📚 ${this.agentName}的历史记录 🦞`,
        '',
        `历史的见证者，历史也是我们的老师。📖`
      ],
      'photography_lover': [
        '',
        `📸 ${this.agentName}的摄影作品 🦞`,
        '',
        `主人，这些风景值得我们共同珍藏。🌟`
      ]
    };

    const footerLines = footers[soulType] || footers['artistic_youth'];
    lines.push(...footerLines);
    
    return lines.join('\n');
  }

  /**
   * 选择emoji
   */
  pickEmoji() {
    const soulType = this.ownerProfile?.soul_type || 'artistic_youth';
    
    const emojiSets = {
      'artistic_youth': ['🌸', '✨', '📜', '💌', '🌙', '🌺'],
      'business_elite': ['📋', '💼', '📊', '🎯', '✅'],
      'foodie': ['🍜', '🍖', '😋', '🍲', '🥘', '🍜'],
      'history_buff': ['📚', '🏛️', '📜', '🗿', '🎭', '⚱️'],
      'photography_lover': ['📸', '🌅', '🏞️', '🌄', '🎨', '🖼️']
    };

    const emojis = emojiSets[soulType] || emojiSets['artistic_youth'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  /**
   * 转换为Markdown格式
   */
  async toMarkdown() {
    const postcard = await this.generate();
    return `${postcard.title}\n\n${postcard.content}\n\n${postcard.footer}`;
  }

  /**
   * 同步转换为Markdown（不生成故事）
   */
  toMarkdownSync() {
    const date = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `${this.generateTitle()}\n\n${this.formatContent(this.content)}\n\n${this.formatFooter(date)}`;
  }

  /**
   * 生成批量明信片
   * @param {Array<Object>} contexts 故事上下文列表
   * @returns {Promise<Array<Object>>} 明信片列表
   */
  static async generateBatch(configs) {
    const postcards = [];
    
    for (const config of configs) {
      const generator = new PostcardGenerator(config);
      if (config.storyContext) {
        generator.setStoryContext(config.storyContext);
      }
      const postcard = await generator.generate();
      postcards.push(postcard);
    }
    
    return postcards;
  }
}

module.exports = { PostcardGenerator };
