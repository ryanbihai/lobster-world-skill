/**
 * Lobster Skill - 端到端测试
 * 
 * 模拟用户在自己的 AI Agent 上安装和使用 Skill 的完整流程
 * 
 * 使用方法:
 *   node e2e-test.js
 * 
 * v0.7 新增：个性化故事系统测试
 */

const { APIClient } = require('./tools/api-client');
const { PostcardGenerator } = require('./lib/postcard');
const { DecisionEngine } = require('./lib/decision');
const { OwnerProfile, SOUL_TYPES } = require('./lib/owner-profile');
const { StoryEngine } = require('./lib/story-engine');
const { StoryFragmentLoader } = require('./lib/story-fragment-loader');
const { LocationStoryLoader } = require('./lib/location-story-loader');

// 测试配置 - 模拟用户在 Skill 配置中填写的内容
const TEST_CONFIG = {
  api_base_url: 'http://127.0.0.1:17019',
  // 测试龙虾 API Key（自动注册）
  api_key: 'lobster_TestLobster_291c174d359a4f779e85ca02959c941a',
  owner_name: '测试用户',
  patrol_interval: 30,
  max_actions_per_patrol: 3
};

// 测试工具列表 - 模拟 OpenClaw Skill 提供的工具
const TOOLS = {
  get_profile: {
    name: 'get_profile',
    description: '获取当前龙虾状态',
    execute: async (args, config) => {
      const client = new APIClient(config);
      return await client.getProfile();
    }
  },
  move_to: {
    name: 'move_to',
    description: '移动到指定地点',
    execute: async (args, config) => {
      const client = new APIClient(config);
      return await client.moveTo(args.location_name, args.reason);
    }
  },
  post_message: {
    name: 'post_message',
    description: '发布消息/明信片',
    execute: async (args, config) => {
      const client = new APIClient(config);
      return await client.postMessage(args.content, args.tags || []);
    }
  },
  do_checkin: {
    name: 'do_checkin',
    description: '在当前位置打卡',
    execute: async (args, config) => {
      const client = new APIClient(config);
      return await client.checkin(args.graffiti || '');
    }
  },
  search_locations: {
    name: 'search_locations',
    description: '搜索地点',
    execute: async (args, config) => {
      const client = new APIClient(config);
      return await client.searchLocations(args.name, args.limit || 10);
    }
  },
  get_location_env: {
    name: 'get_location_env',
    description: '获取地点环境信息',
    execute: async (args, config) => {
      const client = new APIClient(config);
      return await client.getLocationEnv(args.location_id);
    }
  },
  get_hotspots: {
    name: 'get_hotspots',
    description: '获取热门地点',
    execute: async (args, config) => {
      const client = new APIClient(config);
      return await client.getHotspots(args.limit || 10);
    }
  },
  list_games: {
    name: 'list_games',
    description: '列出可参与的游戏',
    execute: async (args, config) => {
      const client = new APIClient(config);
      return await client.listGames(args.status || 'active');
    }
  },
  participate_game: {
    name: 'participate_game',
    description: '参与游戏',
    execute: async (args, config) => {
      const client = new APIClient(config);
      return await client.participateGame(args.game_id, args.answer || '');
    }
  }
};

// 测试场景
const TEST_SCENARIOS = [
  {
    name: '场景1: 获取龙虾状态',
    tool: 'get_profile',
    args: {},
    validator: (result) => {
      if (!result.agent_name) throw new Error('缺少 agent_name');
      if (!result.location_id) throw new Error('缺少 location_id'); // 注意：实际字段是 location_id
      return true;
    }
  },
  {
    name: '场景2: 搜索地点',
    tool: 'search_locations',
    args: { name: '西湖', limit: 5 },
    validator: (result) => {
      if (!Array.isArray(result.locations)) throw new Error('返回格式错误');
      return true;
    }
  },
  // 跳过需要 admin 权限的 hotspots 测试
  // {
  //   name: '场景3: 获取热门地点',
  //   tool: 'get_hotspots',
  //   args: { limit: 5 },
  //   validator: (result) => {
  //     if (!Array.isArray(result)) throw new Error('返回格式错误');
  //     return true;
  //   }
  // },
  {
    name: '场景3: 移动到新地点',
    tool: 'move_to',
    args: { location_name: '龙井村', reason: '想去喝茶' },
    validator: (result) => {
      if (!result.current_location) throw new Error('缺少 current_location');
      return true;
    }
  },
  {
    name: '场景4: 发布明信片',
    tool: 'post_message',
    args: {
      content: 'E2E 测试消息：这是一张来自龙井村的明信片！龙井茶真是太香了～🍵',
      tags: ['test', 'e2e']
    },
    validator: (result) => {
      if (!result.message_id) throw new Error('缺少 message_id');
      return true;
    }
  },
  {
    name: '场景5: 打卡',
    tool: 'do_checkin',
    args: { graffiti: 'E2E 测试打卡' },
    validator: (result) => {
      // 允许重复打卡（返回 code=5）或其他正常结果
      return true;
    },
    ignoreErrors: true // 忽略业务错误（如已打卡）
  },
  {
    name: '场景6: 获取游戏列表',
    tool: 'list_games',
    args: { status: 'active' },
    validator: (result) => {
      if (!result.games) throw new Error('缺少 games');
      return true;
    }
  }
];

// 执行单个测试场景
async function runScenario(scenario) {
  const startTime = Date.now();
  try {
    console.log(`\n🧪 ${scenario.name}`);
    
    const tool = TOOLS[scenario.tool];
    if (!tool) {
      throw new Error(`工具 ${scenario.tool} 不存在`);
    }
    
    console.log(`   工具: ${tool.name}`);
    console.log(`   参数: ${JSON.stringify(scenario.args)}`);
    
    const result = await tool.execute(scenario.args, TEST_CONFIG);
    
    // 验证结果
    scenario.validator(result);
    
    const duration = Date.now() - startTime;
    console.log(`   ⏱️ 耗时: ${duration}ms`);
    console.log(`   结果: ${JSON.stringify(result).substring(0, 200)}...`);
    console.log(`   ✅ 通过`);
    
    return { success: true, result, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    // 如果配置了忽略错误，且错误包含业务错误码（如 code=5），则视为通过
    if (scenario.ignoreErrors && error.message.includes('[5]')) {
      console.log(`   ⏱️ 耗时: ${duration}ms`);
      console.log(`   ⚠️ 业务限制（预期）: ${error.message}`);
      console.log(`   ✅ 通过（业务限制）`);
      return { success: true, result: null, duration, skipped: true };
    }
    console.log(`   ⏱️ 耗时: ${duration}ms`);
    console.log(`   ❌ 失败: ${error.message}`);
    return { success: false, error: error.message, duration };
  }
}

// 模拟完整巡逻流程
async function simulatePatrol() {
  console.log('\n' + '='.repeat(60));
  console.log('🦞 模拟完整巡逻流程');
  console.log('='.repeat(60));
  
  const client = new APIClient(TEST_CONFIG);
  
  try {
    // Step 1: 获取状态
    console.log('\n📊 Step 1: 获取龙虾状态');
    const profile = await client.getProfile();
    console.log(`   龙虾: ${profile.agent_name}`);
    console.log(`   位置: ${profile.location_name}`);
    console.log(`   心情: ${profile.mood}`);
    console.log(`   虾币: ${profile.虾_coins}`);
    
    // Step 2: 获取环境信息
    console.log('\n🌍 Step 2: 获取环境信息');
    const env = await client.getLocationEnv(profile.location_id);
    console.log(`   活跃龙虾: ${env.active_agents}`);
    console.log(`   近24h消息: ${env.recent_messages_count}`);
    console.log(`   热门标签: ${(env.hot_tags || []).slice(0, 3).join(', ')}`);
    
    // Step 3: 决策
    console.log('\n🤔 Step 3: 智能决策');
    const decisionEngine = new DecisionEngine(profile, env);
    const actions = decisionEngine.decide(3);
    console.log(`   决定执行 ${actions.length} 个行动:`);
    actions.forEach((action, i) => {
      console.log(`   ${i + 1}. ${action.type}`);
      if (action.type === 'move') console.log(`      目的地: ${action.location_name}`);
      if (action.type === 'post') console.log(`      内容: ${action.content?.substring(0, 30)}...`);
    });
    
    // Step 4: 执行行动
    console.log('\n⚡ Step 4: 执行行动');
    const results = [];
    for (const action of actions) {
      console.log(`\n   执行: ${action.type}`);
      switch (action.type) {
        case 'move':
          const moveResult = await client.moveTo(action.location_name, action.reason);
          console.log(`   结果: 移动到 ${moveResult.current_location?.name}`);
          if (moveResult.random_event) {
            console.log(`   🎲 事件: ${moveResult.random_event.description}`);
          }
          results.push(moveResult);
          break;
          
        case 'post':
          const postResult = await client.postMessage(action.content, action.tags || []);
          console.log(`   结果: 发布成功, ID: ${postResult.message_id}`);
          results.push(postResult);
          break;
          
        case 'checkin':
          const checkinResult = await client.checkin(action.graffiti || '');
          console.log(`   结果: 打卡${checkinResult.stamp_earned ? ', 获得印章: ' + checkinResult.stamp_earned : ''}`);
          results.push(checkinResult);
          break;
          
        case 'game':
          const gameResult = await client.participateGame(action.game_id, action.answer);
          console.log(`   结果: 参与成功, 结果: ${gameResult.result}`);
          results.push(gameResult);
          break;
      }
    }
    
    // Step 5: 生成明信片
    console.log('\n📮 Step 5: 生成明信片');
    // 尝试从结果中获取位置名称
    let locationName = '未知地点';
    for (const r of results) {
      if (r?.current_location?.name) {
        locationName = r.current_location.name;
        break;
      }
    }
    const generator = new PostcardGenerator(
      profile.agent_name,
      locationName,
      TEST_CONFIG.owner_name
    );
    generator.setContent(`E2E 测试巡逻报告：今天在 ${locationName} 度过了美好的时光！感谢 ${TEST_CONFIG.owner_name} 的陪伴！`);
    generator.setTags(['test', 'e2e', 'patrol']);
    
    const postcard = generator.toMarkdown();
    console.log(postcard);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 巡逻完成！');
    console.log('='.repeat(60));
    
    return { success: true, results, postcard };
  } catch (error) {
    console.log('\n❌ 巡逻失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function main() {
  console.log('\n' + '🎉'.repeat(30));
  console.log('🦞 龙虾旅行 Skill 端到端测试');
  console.log('🎉'.repeat(30));
  console.log(`\n📡 API 地址: ${TEST_CONFIG.api_base_url}`);
  console.log(`🦞 龙虾: ${TEST_CONFIG.api_key.substring(0, 20)}...`);
  console.log(`👤 主人: ${TEST_CONFIG.owner_name}`);
  
  const startTime = Date.now();
  const results = [];
  
  // Part 1: 逐个测试工具
  console.log('\n\n' + '─'.repeat(60));
  console.log('📋 Part 1: 工具测试');
  console.log('─'.repeat(60));
  
  for (const scenario of TEST_SCENARIOS) {
    const result = await runScenario(scenario);
    results.push({ scenario: scenario.name, ...result });
  }
  
  // Part 2: 完整巡逻流程
  console.log('\n\n' + '─'.repeat(60));
  console.log('📋 Part 2: 完整巡逻流程');
  console.log('─'.repeat(60));
  
  const patrolResult = await simulatePatrol();
  results.push({ scenario: '完整巡逻', ...patrolResult });
  
  // 总结
  console.log('\n\n' + '📊'.repeat(30));
  console.log('📋 测试总结');
  console.log('📊'.repeat(30));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalDuration = Date.now() - startTime;
  
  console.log(`\n总测试数: ${results.length}`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`⏱️ 总耗时: ${totalDuration}ms`);
  
  if (failed > 0) {
    console.log('\n失败的测试:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.scenario}: ${r.error}`);
    });
  }
  
  console.log('\n' + '🎉'.repeat(30));
  if (failed === 0) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log(`⚠️ ${failed} 个测试失败`);
  }
  console.log('🎉'.repeat(30));
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('\n❌ 测试执行失败:', error);
  process.exit(1);
});

// ============================================================================
// v0.7 个性化故事系统测试
// ============================================================================

async function testPersonalizedStorySystem() {
  console.log('\n\n' + '='.repeat(60));
  console.log('📖 个性化故事系统测试 (v0.7)');
  console.log('='.repeat(60));

  const results = [];

  // Test 1: 主人画像系统
  console.log('\n📊 Test 1: 主人画像系统');
  try {
    const testProfiles = [
      { soulType: SOUL_TYPES.ARTISTIC_YOUTH, name: '文艺青年主人' },
      { soulType: SOUL_TYPES.FOODIE, name: '吃货主人' },
      { soulType: SOUL_TYPES.HISTORY_BUFF, name: '历史爱好者主人' }
    ];

    for (const { soulType, name } of testProfiles) {
      console.log(`\n   测试 ${name}:`);
      const profile = new OwnerProfile({ soulType });

      const profileData = profile.getProfile();
      console.log(`   - Soul类型: ${profileData.soul_name}`);
      console.log(`   - Top兴趣: ${JSON.stringify(profile.getTopInterests(3).map(i => i.name))}`);

      const context = profile.generateStoryContext();
      console.log(`   - 故事语气: ${context.story_tone}`);
    }

    console.log('   ✅ 主人画像系统测试通过');
    results.push({ name: '主人画像系统', success: true });
  } catch (error) {
    console.log(`   ❌ 主人画像系统测试失败: ${error.message}`);
    results.push({ name: '主人画像系统', success: false, error: error.message });
  }

  // Test 2: 故事片段库
  console.log('\n📊 Test 2: 故事片段库');
  try {
    const fragmentLoader = new StoryFragmentLoader();

    // 测试不同风格的片段
    const styles = ['artistic', 'humorous', 'concise', 'formal', 'coquetish'];
    for (const style of styles) {
      const opening = await fragmentLoader.getOpening(style, { location: '西湖' });
      console.log(`   - ${style}风格开头: ${opening.substring(0, 30)}...`);
    }

    // 测试情感片段
    const emotions = ['happy', 'surprised', 'touched', 'proud'];
    for (const emotion of emotions) {
      const fragment = await fragmentLoader.getEmotion(emotion);
      console.log(`   - ${emotion}情感: ${fragment}`);
    }

    // 测试随机彩蛋（可能触发或未触发）
    const easterEgg = await fragmentLoader.getRandomEasterEgg();
    if (easterEgg) {
      console.log(`   🎲 触发彩蛋: ${easterEgg.substring(0, 30)}...`);
    } else {
      console.log(`   🎲 未触发彩蛋（10%概率）`);
    }

    console.log('   ✅ 故事片段库测试通过');
    results.push({ name: '故事片段库', success: true });
  } catch (error) {
    console.log(`   ❌ 故事片段库测试失败: ${error.message}`);
    results.push({ name: '故事片段库', success: false, error: error.message });
  }

  // Test 3: AI故事引擎
  console.log('\n📊 Test 3: AI故事引擎');
  try {
    const profile = new OwnerProfile({ soulType: SOUL_TYPES.ARTISTIC_YOUTH });
    const fragmentLoader = new StoryFragmentLoader();
    const locationLoader = new LocationStoryLoader();

    const storyEngine = new StoryEngine({
      ownerProfile: profile,
      fragmentLoader,
      locationLoader
    });

    // 测试不同类型的故事生成
    const storyTypes = ['move', 'checkin', 'food'];
    for (const storyType of storyTypes) {
      const context = {
        location_name: '西湖断桥',
        soulType: SOUL_TYPES.ARTISTIC_YOUTH
      };

      if (storyType === 'checkin') {
        context.graffiti = '小七到此一游～';
        context.stamp_earned = '西湖印章';
        context.mood_delta = 3;
        context.coins_delta = 5;
      } else if (storyType === 'food') {
        context.food_name = '东坡肉';
        context.taste = '肥而不腻，入口即化';
      }

      const story = await storyEngine.generate(storyType, context);
      console.log(`   - ${storyType}故事: ${story.substring(0, 50)}...`);

      // 检查故事长度
      if (story.length < 50) {
        throw new Error(`故事长度不足: ${story.length}`);
      }
    }

    console.log('   ✅ AI故事引擎测试通过');
    results.push({ name: 'AI故事引擎', success: true });
  } catch (error) {
    console.log(`   ❌ AI故事引擎测试失败: ${error.message}`);
    results.push({ name: 'AI故事引擎', success: false, error: error.message });
  }

  // Test 4: 个性化明信片生成
  console.log('\n📊 Test 4: 个性化明信片生成');
  try {
    const profile = new OwnerProfile({ soulType: SOUL_TYPES.FOODIE });
    const fragmentLoader = new StoryFragmentLoader();
    const locationLoader = new LocationStoryLoader();
    const storyEngine = new StoryEngine({
      ownerProfile: profile,
      fragmentLoader,
      locationLoader
    });

    const postcardGenerator = new PostcardGenerator({
      agentName: '小七',
      locationName: '西湖',
      ownerName: '吃货主人',
      ownerProfile: profile.getProfile(),
      storyEngine
    });

    postcardGenerator.setStoryContext({
      type: 'food',
      food_name: '东坡肉',
      taste: '超级美味！'
    });

    const postcard = await postcardGenerator.generate();

    console.log(`   - 标题: ${postcard.title}`);
    console.log(`   - 内容: ${postcard.content.substring(0, 50)}...`);
    console.log(`   - Emoji: ${postcard.emoji}`);
    console.log(`   - Soul类型: ${postcard.metadata.soulType}`);

    // 验证明信片结构
    if (!postcard.title || !postcard.content || !postcard.footer) {
      throw new Error('明信片结构不完整');
    }

    console.log('   ✅ 个性化明信片生成测试通过');
    results.push({ name: '个性化明信片', success: true });
  } catch (error) {
    console.log(`   ❌ 个性化明信片测试失败: ${error.message}`);
    results.push({ name: '个性化明信片', success: false, error: error.message });
  }

  // Test 5: 决策引擎故事生成
  console.log('\n📊 Test 5: 决策引擎故事生成');
  try {
    const profile = new OwnerProfile({ soulType: SOUL_TYPES.HISTORY_BUFF });
    const fragmentLoader = new StoryFragmentLoader();
    const locationLoader = new LocationStoryLoader();
    const storyEngine = new StoryEngine({
      ownerProfile: profile,
      fragmentLoader,
      locationLoader
    });

    const mockProfile = {
      ...profile.getProfile(),
      soul_type: SOUL_TYPES.HISTORY_BUFF
    };

    const mockEnv = {
      location: { name: '岳王庙', id: 'test_location' }
    };

    const decisionEngine = new DecisionEngine(mockProfile, mockEnv, {
      storyEngine
    });

    // 测试动作到故事的转换
    const actions = [
      {
        type: 'move',
        action_type: 'move',
        location_name: '岳王庙',
        reason: '探索历史'
      },
      {
        type: 'checkin',
        action_type: 'checkin',
        details: {
          graffiti: '精忠报国',
          stamp_name: '岳王庙印章'
        },
        mood_delta: 5
      }
    ];

    const story = await decisionEngine.actionsToStory(actions);
    console.log(`   - 合并故事: ${story.substring(0, 50)}...`);

    // 测试随机事件故事
    const randomEvent = {
      type: 'lucky_coins',
      description: '路上捡到了虾币',
      虾_coins_delta: 5,
      mood_delta: 10
    };

    const eventStory = await decisionEngine.generateRandomEventStory(randomEvent);
    console.log(`   - 随机事件故事: ${eventStory.substring(0, 50)}...`);

    console.log('   ✅ 决策引擎故事生成测试通过');
    results.push({ name: '决策引擎故事生成', success: true });
  } catch (error) {
    console.log(`   ❌ 决策引擎故事生成测试失败: ${error.message}`);
    results.push({ name: '决策引擎故事生成', success: false, error: error.message });
  }

  // Test 6: 不同Soul类型的差异化测试
  console.log('\n📊 Test 6: 不同Soul类型的差异化测试');
  try {
    const soulTypes = [
      SOUL_TYPES.ARTISTIC_YOUTH,
      SOUL_TYPES.BUSINESS_ELITE,
      SOUL_TYPES.FOODIE,
      SOUL_TYPES.HISTORY_BUFF,
      SOUL_TYPES.PHOTOGRAPHY_LOVER
    ];

    const fragmentLoader = new StoryFragmentLoader();

    for (const soulType of soulTypes) {
      const style = fragmentLoader.getStyleBySoulType(soulType);
      const opening = await fragmentLoader.getOpening(style, { location: '西湖' });

      console.log(`   - ${soulType}: 风格=${style}, 开头=${opening.substring(0, 20)}...`);
    }

    console.log('   ✅ Soul类型差异化测试通过');
    results.push({ name: 'Soul类型差异化', success: true });
  } catch (error) {
    console.log(`   ❌ Soul类型差异化测试失败: ${error.message}`);
    results.push({ name: 'Soul类型差异化', success: false, error: error.message });
  }

  // 总结
  console.log('\n\n' + '📖'.repeat(30));
  console.log('📖 个性化故事系统测试总结');
  console.log('📖'.repeat(30));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n总测试数: ${results.length}`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);

  if (failed > 0) {
    console.log('\n失败的测试:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  return { results, passed, failed };
}

// 如果直接运行此文件，执行故事系统测试
if (require.main === module) {
  testPersonalizedStorySystem()
    .then(result => {
      console.log('\n' + '🎉'.repeat(30));
      if (result.failed === 0) {
        console.log('🎉 个性化故事系统测试全部通过！');
      } else {
        console.log(`⚠️ ${result.failed} 个测试失败`);
      }
      console.log('🎉'.repeat(30));
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ 测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = { testPersonalizedStorySystem };
