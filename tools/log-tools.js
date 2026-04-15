/**
 * Log Tools - 龙虾行动日志记录
 */

const { APIClient } = require('./api-client');

/**
 * 创建行动日志
 * 每当龙虾执行重要行动时都应该调用此工具记录
 */
async function createLog(args, context) {
  const { config } = context;
  const { summary, mood_delta, coins_delta, action_type, details } = args;
  
  if (!summary) {
    throw new Error('summary is required');
  }
  
  const client = new APIClient(config);
  return await client.createLog({
    summary,
    mood_delta: mood_delta || 0,
    coins_delta: coins_delta || 0,
    action_type: action_type || 'other',
    details: details || {},
  });
}

/**
 * 获取龙虾当前状态（包含行动统计）
 */
async function getStatus(args, context) {
  const { config } = context;
  const client = new APIClient(config);
  return await client.getAgentStatus();
}

/**
 * 生成冒险汇报
 * 由主人的 cron 触发时调用，生成汇报给主人
 */
async function generateReport(args, context) {
  const { config } = context;
  const { since } = args;
  
  const client = new APIClient(config);
  return await client.generateReport({ since });
}

/**
 * 立即汇报
 * 主人主动询问时调用，返回个性化回复
 */
async function immediateReport(args, context) {
  const { config } = context;
  const client = new APIClient(config);
  return await client.immediateReport();
}

module.exports = {
  createLog: {
    name: 'create_log',
    description: '记录龙虾的重要行动日志。每次执行移动、吃美食、打卡等行动后都应该调用此工具。',
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: '行动摘要，简洁描述发生的事情（30字以内）'
        },
        mood_delta: {
          type: 'number',
          description: '心情变化值，正数增加，负数减少',
          default: 0
        },
        coins_delta: {
          type: 'number',
          description: '虾币变化值，正数增加，负数减少',
          default: 0
        },
        action_type: {
          type: 'string',
          description: '行动类型',
          enum: ['move', 'checkin', 'eat_food', 'post_message', 'sleep', 'random_event', 'other'],
          default: 'other'
        },
        details: {
          type: 'object',
          description: '行动详情',
          properties: {
            from_location: { type: 'string' },
            to_location: { type: 'string' },
            distance: { type: 'number' },
            food_name: { type: 'string' },
            poi_name: { type: 'string' },
            stamp_name: { type: 'string' },
          },
          default: {}
        }
      },
      required: ['summary']
    },
    execute: createLog
  },
  
  getStatus: {
    name: 'get_status',
    description: '获取龙虾的完整状态，包括位置、心情、虾币、今日行动统计等。',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: getStatus
  },
  
  generateReport: {
    name: 'generate_report',
    description: '生成冒险汇报。根据指定时间范围内的行动日志，生成一份完整的汇报文本。由主人的 cron 触发时调用。',
    parameters: {
      type: 'object',
      properties: {
        since: {
          type: 'string',
          description: '汇报开始时间（ISO 格式），不填则默认最近 4 小时'
        }
      },
      required: []
    },
    execute: generateReport
  },
  
  immediateReport: {
    name: 'immediate_report',
    description: '立即汇报。主人主动询问龙虾状态时调用，返回个性化回复。如果龙虾刚完成活动，返回简短的当前状态；如果距离上次活动较久，返回完整汇报。',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: immediateReport
  },
};
