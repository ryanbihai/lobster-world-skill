# 龙虾行为改进设计文档

## 核心改进目标

1. **汇报精简**：一封明信片，一目了然
2. **深度探索**：每个城市停留1-2天，细细品味
3. **心情无限制**：心情好坏都能自由移动

---

## 1. 汇报系统改进

### 当前问题
汇报内容过于详细，包含：
- 今日足迹（所有移动路径）
- 美食清单
- 近期动态（每分钟记录）
- 心情分析
- 行动统计

### 改进方案：明信片模式

**精简汇报格式**（不超过200字）：

```
🦞 小虾明信片 | 📍石家庄

亲爱的：
今天在石家庄逛了一整天！
去了正定古城，品尝了正宗安徽板面。
这里的寺庙很有历史感，心情特别好。
明天继续探索！

❤️ 心情：85 | 💰 虾币：99800
2026.04.16 🦞
```

**汇报触发机制**：
- Cron巡逻时：只发一条明信片
- 主人询问时：简短回复当前状态
- 紧急情况：才详细汇报

---

## 2. 城市探索深度设计

### 当前问题
- 移动概率 40%/60%，太频繁换城市
- 没有"城市探索天数"概念
- POI探索深度不够

### 改进方案：城市沉浸式探索

**城市探索天数计算**：
```javascript
// 城市探索策略
const EXPLORATION_STRATEGY = {
  // 每个城市最少停留时间
  MIN_DAYS: 1,           // 1天
  MAX_DAYS: 2,           // 最多2天
  
  // 决定因素
  POI_COUNT: {
    SMALL: { min: 2, days: 1 },      // 少于5个景点：1天
    MEDIUM: { min: 5, days: 1 },     // 5-10个景点：1-2天
    LARGE: { min: 10, days: 2 }      // 超过10个景点：2天
  },
  
  // 探索完所有POI才换城市
  EXPLORE_ALL_POI: true
};
```

**详细设计**：

| 城市规模 | 景点数量 | 建议停留 | 每日行动 |
|---------|---------|---------|---------|
| 小城市 | 3-5个 | 1天 | 上午景点1，下午景点2 |
| 中城市 | 6-10个 | 1-2天 | 上午景点1+2，下午景点3+4 |
| 大城市 | 10+个 | 2天 | 第一天3个，第二天3个 |

**每个景点的深度体验**：
```javascript
// 每个景点的探索深度
const POI_EXPLORATION = {
  // 到达景点
  ARRIVE: "哇，终于到了这里！",
  
  // 探索景点（根据POI类型）
  EXPLORE_TYPES: {
    historical: [
      "这里的建筑好有历史感！",
      "据说这里发生过..."
    ],
    natural: [
      "风景太美了！",
      "空气里都是大自然的味道"
    ],
    cultural: [
      "这里的文化氛围真浓厚！",
      "感受到了当地人的热情"
    ]
  },
  
  // 打卡
  CHECKIN: "在这里打卡留念！",
  
  // 发感悟
  REFLECTION: [
    "站在这里，我想起了...",
    "这段历史真的很有意思",
    "原来是这样的故事..."
  ]
};
```

---

## 3. 心情与移动解耦

### 当前问题
- 心情>100时无法移动
- 这不符合逻辑！心情好应该更想出去探索

### 改进方案：心情只是状态，不限制行动

**心情系统重新设计**：
```javascript
const MOOD_SYSTEM = {
  // 心情范围：0-200（扩大上限）
  MIN: 0,
  MAX: 200,         // 心情可以超过100
  
  // 心情对行为的影响（软性，非硬性限制）
  BEHAVIOR_INFLUENCE: {
    LOW: {      // 0-30：有点累
      exploreChance: 0.3,    // 30%概率继续探索
      restChance: 0.7        // 70%概率休息
    },
    MEDIUM: {   // 31-70：正常
      exploreChance: 0.6,
      restChance: 0.4
    },
    HIGH: {     // 71-150：心情好
      exploreChance: 0.8,    // 80%概率积极探索
      restChance: 0.2
    },
    MAX: {      // 151-200：超级开心
      exploreChance: 0.95,   // 95%概率疯狂探索
      restChance: 0.05
    }
  },
  
  // 心情不影响移动！任何心情都可以自由移动
  MOVE_RESTRICTION: false
};
```

**心情变化机制**：
```javascript
// 心情增减
const MOOD_DELTA = {
  // 到达新景点：+3~8
  VISIT_POI: { min: 3, max: 8 },
  
  // 打卡成功：+2~5
  CHECKIN: { min: 2, max: 5 },
  
  // 品尝美食：+5~10
  EAT_FOOD: { min: 5, max: 10 },
  
  // 遇到其他龙虾：+2~5
  MEET_LOBSTER: { min: 2, max: 5 },
  
  // 移动消耗：-1~3
  MOVE: { min: 1, max: 3 },
  
  // 疲劳累积：-1~5
  TIRED: { min: 1, max: 5 }
};
```

---

## 4. 移动规则重新设计

### 当前移动规则
```javascript
// 旧规则
shouldChangeCity() {
  // exploration_day < 1：60%概率换城市
  // exploration_day >= 1：40%概率换城市
}
```

### 改进后的移动规则
```javascript
// 新规则
const MOVE_RULES = {
  // 城市停留策略
  STAY_STRATEGY: {
    // 探索完当前城市所有景点才考虑换城市
    EXPLORE_ALL_FIRST: true,
    
    // 换城市概率（探索完景点后）
    CHANGE_PROBABILITY: {
      day1: 0.1,   // 第1天：10%概率换城市
      day2: 0.3,   // 第2天：30%概率换城市
      exhausted: 0.8  // 景点全部探索完：80%换城市
    },
    
    // 距离限制
    MAX_DISTANCE: 300,  // 公里
    PREFER_CLOSER: true // 优先选择近距离城市
  },
  
  // 移动触发条件（满足任一即可）
  TRIGGERS: [
    {
      condition: 'exploration_days >= 2',
      probability: 0.8,
      reason: '在这个城市待够了，去看看别的地方'
    },
    {
      condition: 'all_poi_explored',
      probability: 0.95,
      reason: '这个城市的景点都看完了'
    },
    {
      condition: 'mood < 20',
      probability: 0.6,
      reason: '心情不好，换个地方试试'
    }
  ]
};
```

---

## 5. 每日行动模式

### 白天（6:00-18:00）
```javascript
const DAY_ACTIONS = {
  morning: {
    time: '6:00-10:00',
    actions: [
      { type: 'explore', poi: 1, description: '清晨散步，发现新景点' },
      { type: 'checkin', always: true, description: '打卡留念' }
    ]
  },
  
  noon: {
    time: '10:00-14:00',
    actions: [
      { type: 'food', description: '寻找当地美食' },
      { type: 'postcard', description: '发明信片分享' }
    ]
  },
  
  afternoon: {
    time: '14:00-18:00',
    actions: [
      { type: 'explore', poi: 2, description: '继续探索' },
      { type: 'reflection', description: '感悟和思考' }
    ]
  }
};
```

### 晚上（18:00-6:00）
```javascript
const NIGHT_ACTIONS = {
  evening: {
    time: '18:00-21:00',
    actions: [
      { type: 'rest', description: '休息恢复' },
      { type: 'summary', description: '写日记总结' }
    ]
  },
  
  night: {
    time: '21:00-6:00',
    actions: [
      { type: 'sleep', mood_delta: 10, description: '睡眠恢复心情' }
    ]
  }
};
```

---

## 6. 汇报内容精简示例

### ❌ 旧汇报（太长）
```
🦞 小虾巡逻报告 | 15:30

📍 当前位置：石家庄
❤️ 心情：101
💰 虾币：100010

---

🚶 今日足迹：
石家庄 → (短暂停留) → 北京（吃烤鸭）→ 天津 → 保定 → 石家庄

🍜 今日美食：
北京烤鸭！酥脆多汁，+10心情

📝 近期动态：
- 上午：在北京天安门附近溜达
- 中午：品尝北京烤鸭（-25币）
- 下午：从天津到北京（+5心情）
- 稍早：在保定发呆思考虾生（-5心情）
- 现在：石家庄发来明信片

⚠️ 小状况：
心情值超过系统上限100，暂时无法移动...

📊 本次汇报：
- 行动次数：3次
- 心情变化：+10
- 虾币变化：-28

主人，小虾在石家庄向您报平安！
```

### ✅ 新汇报（精简）
```
🦞 小虾明信片 | 📍石家庄

亲爱的：

今天在石家庄过得很充实！
上午去了正定古城，感受千年历史的厚重；
中午品尝了正宗的石家庄缸炉烧饼，香脆可口；
下午在古城墙上散步，俯瞰整个城市。

明天继续探索这座城市的其他地方！

❤️ 心情：85 | 💰 虾币：99800
2026.04.16 🦞
```

---

## 7. 实现优先级

| 优先级 | 改进项 | 难度 | 说明 |
|--------|--------|------|------|
| P0 | 心情不限制移动 | 低 | 修改后端API或decision.js |
| P0 | 汇报精简 | 中 | 修改generate_report模板 |
| P1 | 城市停留1-2天 | 中 | 修改shouldChangeCity逻辑 |
| P1 | 每个景点深度体验 | 中 | 增强POI探索逻辑 |
| P2 | 每日行动时间表 | 高 | 精细化时间控制 |

---

## 8. 配置文件

建议在 `config/game-config.json` 中添加：

```json
{
  "lobster": {
    "exploration": {
      "min_city_days": 1,
      "max_city_days": 2,
      "explore_all_poi_first": true
    },
    "report": {
      "max_length": 200,
      "mode": "postcard"
    },
    "mood": {
      "max": 200,
      "move_restriction": false
    },
    "daily_actions": {
      "morning": ["explore_poi", "checkin"],
      "noon": ["food", "postcard"],
      "afternoon": ["explore_poi", "reflection"]
    }
  }
}
```
