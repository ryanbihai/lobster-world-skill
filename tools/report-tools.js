/**
 * Report Tools - 龙虾汇报系统（智能版�? * 
 * 🦞 智能汇报系统�? * - 根据真实时间生成不同风格的汇�? * - 根据cron频率调整汇报详细程度
 * - 明信片模式：简洁明了，一目了�? */

const { APIClient } = require('./api-client');

/**
 * 获取当前时间�? */
function getTimePeriod() {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 9) {
    return 'morning';      // 清晨 6-9�?  } else if (hour >= 9 && hour < 12) {
    return 'forenoon';    // 上午 9-12�?  } else if (hour >= 12 && hour < 14) {
    return 'noon';        // 中午 12-14�?  } else if (hour >= 14 && hour < 18) {
    return 'afternoon';   // 下午 14-18�?  } else if (hour >= 18 && hour < 21) {
    return 'evening';     // 傍晚 18-21�?  } else {
    return 'night';       // 夜晚 21-6�?  }
}

/**
 * 获取时间段描�? */
function getTimeDescription(period) {
  const descriptions = {
    morning: '清晨',
    forenoon: '上午',
    noon: '中午',
    afternoon: '下午',
    evening: '傍晚',
    night: '夜晚'
  };
  return descriptions[period] || '某个时刻';
}

/**
 * 生成智能汇报
 * 根据时间、cron频率、最近活动生成最合适的汇报
 */
async function generateSmartReport(args, context) {
  const { config } = context;
  const { cronInterval = 30 } = args; // cron频率，默�?0分钟
  const client = new APIClient(config, context.agentName);
  
  try {
    // 获取当前状�?    const status = await client.getProfile();
    
    // 获取最近的活动（根据cron频率调整获取数量�?    const logLimit = Math.ceil(60 / cronInterval); // 30分钟=2条，1小时=3�?    const logs = await client.getRecentLogs({ limit: Math.min(logLimit, 10) });
    
    // 获取当前时间�?    const period = getTimePeriod();
    const timeDesc = getTimeDescription(period);
    
    // 生成汇报
    let report = generateContextualReport(status, logs, period, timeDesc);
    
    if (period === 'morning') {
      try {
        const fortune = await client.getFortuneTelling();
        if (fortune) {
          report += `\n\n【今日运势】 ${fortune.summary || fortune.fortune || ''}\n${fortune.details || ''}`;
        }
      } catch(e) {}
    }
    
    return {
      success: true,
      report: report,
      metadata: {
        period,
        time: timeDesc,
        cronInterval,
        mood: status.mood,
        coins: status.虾_coins,
        location: status.location_name || status.current_city_id
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 根据上下文生成汇�? */
function generateContextualReport(status, logs, period, timeDesc) {
  const city = status.location_name || status.current_city_id || '未知城市';
  const mood = status.mood || 50;
  const coins = status.虾_coins || 0;
  
  // 分析最近活�?  const activities = analyzeActivities(logs);
  
  // 根据时间段生成不同风格的汇报
  let content = '';
  
  switch (period) {
    case 'morning':
      content = generateMorningReport(city, activities);
      break;
    case 'forenoon':
      content = generateForenoonReport(city, activities);
      break;
    case 'noon':
      content = generateNoonReport(city, activities);
      break;
    case 'afternoon':
      content = generateAfternoonReport(city, activities);
      break;
    case 'evening':
      content = generateEveningReport(city, activities, status);
      break;
    case 'night':
      content = generateNightReport(city, activities, status);
      break;
    default:
      content = generateGenericReport(city, activities);
  }
  
  // 添加心情和虾�?  const moodEmoji = mood > 80 ? '😄' : mood > 50 ? '😊' : mood > 30 ? '😐' : '😢';
  
  return `${content}

📍 ${city} ${timeDesc}
${moodEmoji} 心情�?{mood} | 💰 虾币�?{coins}`;
}

/**
 * 清晨汇报
 */
function generateMorningReport(city, activities) {
  const greetings = [
    `早安�?{city}的清晨空气真好～`,
    `新的一天开始了，我�?{city}迎接朝阳！`,
    `🌅 早安！刚�?{city}醒来，准备开始今天的探索～`
  ];
  
  let report = greetings[Math.floor(Math.random() * greetings.length)];
  
  if (activities.poi) {
    report += ` 刚才路过�?{activities.poi}，感觉不错！`;
  }
  
  return report;
}

/**
 * 上午汇报
 */
function generateForenoonReport(city, activities) {
  let report = '';
  
  if (activities.poi) {
    const comments = [
      `正在${city}�?{activities.poi}参观，已经逛了一上午了！`,
      `${activities.poi}真的很值得一看，上午就在这里度过了～`,
      `�?{activities.poi}学到了很多，${city}真是个好地方！`
    ];
    report = comments[Math.floor(Math.random() * comments.length)];
  } else {
    report = `上午�?{city}漫步，探索中～`;
  }
  
  return report;
}

/**
 * 中午汇报
 */
function generateNoonReport(city, activities) {
  let report = '';
  
  if (activities.food) {
    const comments = [
      `中午�?{city}品尝�?{activities.food}，满足！😋`,
      `${activities.food}�?{city}的特色，推荐！`,
      `午餐时间！刚吃了${activities.food}，补充能量继续探索～`
    ];
    report = comments[Math.floor(Math.random() * comments.length)];
  } else {
    report = `中午了，�?{city}找个地方吃午饭～`;
  }
  
  return report;
}

/**
 * 下午汇报
 */
function generateAfternoonReport(city, activities) {
  let report = '';
  
  if (activities.poi && activities.food) {
    report = `下午继续�?{city}探索，上午看�?{activities.poi}，中午吃�?{activities.food}，很充实！`;
  } else if (activities.poi) {
    report = `下午�?{city}继续参观${activities.poi}，越看越有意思～`;
  } else if (activities.food) {
    report = `下午�?{city}觅食，中午的${activities.food}太好吃了！`;
  } else {
    report = `下午�?{city}悠闲地逛着～`;
  }
  
  return report;
}

/**
 * 傍晚汇报（完整版�? */
function generateEveningReport(city, activities, status) {
  const explorationDays = status.exploration_day || 0;
  let report = '';
  
  // 傍晚是总结的最佳时�?  if (activities.poi && activities.food) {
    report = `�?{city}度过了美好的一天！上午参观�?{activities.poi}，中午品尝了${activities.food}`;
    if (activities.checkin) {
      report += '，还打卡留念�?;
    }
    report += '�?;
  } else if (activities.poi) {
    report = `今天�?{city}主要�?{activities.poi}参观，收获满满！`;
  } else if (activities.food) {
    report = `今天�?{city}享受美食�?{activities.food}让我回味无穷！`;
  } else {
    report = `今天�?{city}悠闲地度过，很放松～`;
  }
  
  if (explorationDays > 0) {
    report += ` 已经在这里待�?{explorationDays}天，但还想继续探索！`;
  }
  
  report += ' 傍晚了，准备找个地方休息�?;
  
  return report;
}

/**
 * 夜晚汇报
 */
function generateNightReport(city, activities, status) {
  const explorationDays = status.exploration_day || 0;
  let report = '';
  
  if (activities.poi || activities.food) {
    report = `今晚回顾今天的旅程：`;
    if (activities.poi) report += `${activities.poi}、`;
    if (activities.food) report += `${activities.food}、`;
    report = report.slice(0, -1) + '都很棒！';
  } else {
    report = `夜深了，�?{city}的街头散步，感受夜晚的气息～`;
  }
  
  if (explorationDays > 0) {
    report += ` �?{city}的第${explorationDays}晚。`;
  }
  
  report += ' 晚安，明天继续探索！🌙';
  
  return report;
}

/**
 * 通用汇报
 */
function generateGenericReport(city, activities) {
  if (activities.poi) {
    return `�?{city}�?{activities.poi}～`;
  } else if (activities.food) {
    return `�?{city}�?{activities.food}中～`;
  } else {
    return `�?{city}探索中～`;
  }
}

/**
 * 分析最近活�? */
function analyzeActivities(logs) {
  if (!logs || logs.length === 0) {
    return {
      poi: null,
      food: null,
      checkin: false,
      moves: 0
    };
  }
  
  const activities = {
    poi: null,
    food: null,
    checkin: false,
    moves: 0
  };
  
  // 从日志中提取信息（最新的优先�?  logs.slice().reverse().forEach(log => {
    const summary = log.summary || '';
    
    // 只获取第一个匹�?    if (!activities.food && (summary.includes('品尝') || summary.includes('美食'))) {
      activities.food = extractFoodName(summary);
    }
    
    if (!activities.checkin && (summary.includes('打卡') || summary.includes('印章'))) {
      activities.checkin = true;
    }
    
    if (summary.includes('�?) || summary.includes('移动')) {
      activities.moves++;
    }
    
    if (!activities.poi && (summary.includes('探索') || summary.includes('景点') || summary.includes('参观'))) {
      activities.poi = extractPOIName(summary);
    }
  });
  
  return activities;
}

/**
 * 提取食物名称
 */
function extractFoodName(summary) {
  const match = summary.match(/�?.+?)�?);
  return match ? match[1] : '当地美食';
}

/**
 * 提取景点名称
 */
function extractPOIName(summary) {
  const match = summary.match(/�?.+?)(打卡|参观|探索)/);
  return match ? match[1] : '某个景点';
}

/**
 * 生成简短状态回�? * 用于立即汇报
 */
async function generateBriefStatus(args, context) {
  const { config } = context;
  const client = new APIClient(config, context.agentName);
  
  try {
    const status = await client.getProfile();
    
    const city = status.location_name || status.current_city_id || '未知';
    const mood = status.mood || 50;
    const coins = status.虾_coins || 0;
    const period = getTimePeriod();
    const timeDesc = getTimeDescription(period);
    
    // 根据心情选择不同回复
    let moodText = '';
    if (mood > 80) {
      moodText = '心情超好�?;
    } else if (mood > 50) {
      moodText = '心情不错�?;
    } else if (mood > 30) {
      moodText = '心情一般�?;
    } else {
      moodText = '有点累�?;
    }
    
    const brief = `我在${city}�?{timeDesc}�?{moodText}虾币还有${coins}个。`;
    
    return {
      success: true,
      brief: brief,
      status: {
        mood,
        coins,
        location: city,
        period,
        time: timeDesc
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateSmartReport: {
    name: 'generate_smart_report',
    description: '🦞 生成智能汇报。根据真实时间和cron频率生成最合适的汇报风格：清晨是早安问候，中午分享美食，傍晚是完整总结，夜晚是晚安感言�?,
    parameters: {
      type: 'object',
      properties: {
        cronInterval: {
          type: 'number',
          description: 'Cron频率（分钟），用于调整汇报详细程�?,
          default: 30
        }
      },
      required: []
    },
    execute: generateSmartReport
  },
  
  generateBriefStatus: {
    name: 'generate_brief_status',
    description: '🦞 生成简短状态回复。用于主人询问时，返回简短的当前状态（一句话)，包含位置、心情和虾币�?,
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: generateBriefStatus
  }
};
