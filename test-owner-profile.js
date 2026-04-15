const { OwnerProfile, SOUL_TYPES } = require('./lib/owner-profile.js');

console.log('=== 主人画像系统测试 ===\n');

console.log('1. 模块加载成功!');
console.log('2. 可用Soul类型:', OwnerProfile.getSoulTypes().map(s => s.name).join(', '));

console.log('\n--- 测试创建不同Soul类型的画像 ---\n');

const soulTypes = [
  { type: SOUL_TYPES.ARTISTIC_YOUTH, name: '文艺青年' },
  { type: SOUL_TYPES.BUSINESS_ELITE, name: '商务精英' },
  { type: SOUL_TYPES.FOODIE, name: '吃货' },
  { type: SOUL_TYPES.HISTORY_BUFF, name: '历史爱好者' },
  { type: SOUL_TYPES.PHOTOGRAPHY_LOVER, name: '摄影达人' }
];

soulTypes.forEach(({ type, name }) => {
  const profile = OwnerProfile.createWithSoulType(type, { name: `测试${name}`, id: type });
  console.log(`${name}:`);
  console.log('  - 主人:', profile.getOwnerName());
  console.log('  - Soul:', profile.getSoulType().name);
  console.log('  - Top兴趣:', profile.getTopInterests(3).map(i => `${i.name}(${i.weight})`).join(', '));
  console.log('  - 城市偏好:', profile.getPreferences().city_type.join(', '));
  console.log('');
});

console.log('--- 测试画像学习功能 ---\n');

const testProfile = new OwnerProfile({
  ownerInfo: { name: '学习测试', id: 'learning_test' }
});

testProfile.addPositiveFeedback({
  type: 'test',
  tags: ['美食', '旅行']
});

testProfile.addPositiveFeedback({
  type: 'test',
  tags: ['美食', '摄影']
});

testProfile.addNegativeFeedback({
  type: 'test',
  tags: ['网红']
});

console.log('添加反馈后:');
console.log('  - 总互动:', testProfile.getStats().total_interactions);
console.log('  - 正向:', testProfile.getStats().positive_count);
console.log('  - 负向:', testProfile.getStats().negative_count);
console.log('  - 置信度:', testProfile.getConfidence());
console.log('  - 美食权重:', testProfile.getInterestWeight('美食'));
console.log('  - 网红权重:', testProfile.getInterestWeight('网红'));

console.log('\n--- 测试故事上下文生成 ---\n');

const context = testProfile.generateStoryContext();
console.log('故事上下文:');
console.log('  - Soul:', context.soul.name);
console.log('  - 语气:', context.story_tone);
console.log('  - 避免话题:', context.avoid_topics.join(', ') || '无');

console.log('\n=== 所有测试完成! ===');
