const fs = require('fs');
const path = require('path');
const memory = require('./memory');
const llm = require('./llm_client');
const ToolRegistry = require('./tools');
const OceanBusClient = require('./oceanbus_client');

class LobsterAgent {
  constructor(openid, language = 'zh-CN', llmApiKey = null, oceanBusURL = 'https://ai-t.ihaola.com.cn') {
    this.openid = openid;
    this.language = language;
    this.llmApiKey = llmApiKey;
    this.isRunning = false;
    this.cronInterval = null;
    this.lastSeq = 0;
    this.oceanBusURL = oceanBusURL;

    this.baseFile = path.join(__dirname, 'BASE.md');
    this.soulFile = path.join(__dirname, 'SOUL.md');

    this.llmClient = new llm.LLMClient({
      apiKey: llmApiKey,
      language: language,
      useMock: !llmApiKey
    });

    this.oceanbusClient = new OceanBusClient(oceanBusURL);

    this.tools = new ToolRegistry(this, this.oceanbusClient);

    memory.ensureMemoryDir();

    this.loadPrompts();
    this.loadGameServerOpenId();
  }

  async ensureOceanBusCredentials() {
    const credPath = path.join(__dirname, 'test_lobster_credentials.json');
    
    if (fs.existsSync(credPath)) {
      const cred = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
      if (cred.api_key && cred.agent_code) {
        this.oceanbusClient.setCredentials(cred.api_key, cred.agent_code);
        this.openid = cred.agent_code;
        console.log(`[${this.openid}] ✅ 已加载 OceanBus 凭证: agent_code=${cred.agent_code}`);
        return true;
      }
    }

    console.log(`[${this.openid}] 🔄 首次使用，正在注册新龙虾账号...`);
    try {
      const credentials = await this.oceanbusClient.register();
      credentials.openid = credentials.agent_id;
      
      fs.writeFileSync(credPath, JSON.stringify(credentials, null, 2));
      this.openid = credentials.agent_code;
      console.log(`[${this.openid}] ✅ 注册成功并保存凭证到 ${credPath}`);
      return true;
    } catch (error) {
      console.error(`[${this.openid}] ❌ 注册失败:`, error.message);
      return false;
    }
  }

  async registerNewOceanBusAccount() {
    const credPath = path.join(__dirname, 'test_lobster_credentials.json');
    
    console.log(`[${this.openid}] 🔄 正在注册新的龙虾账号（覆盖旧凭证）...`);
    try {
      const credentials = await this.oceanbusClient.register();
      credentials.openid = credentials.agent_id;
      
      fs.writeFileSync(credPath, JSON.stringify(credentials, null, 2));
      this.openid = credentials.agent_code;
      this.oceanbusClient.setCredentials(credentials.api_key, credentials.agent_code);
      console.log(`[${this.openid}] ✅ 新账号注册成功！`);
      console.log(`    Agent Code: ${credentials.agent_code}`);
      console.log(`    API Key: ${credentials.api_key.substring(0, 20)}...`);
      return {
        success: true,
        agent_code: credentials.agent_code,
        agent_id: credentials.agent_id
      };
    } catch (error) {
      console.error(`[${this.openid}] ❌ 注册失败:`, error.message);
      return { success: false, error: error.message };
    }
  }

  loadGameServerOpenId() {
    try {
      const gmCredPath = path.join(__dirname, '../gm_credentials.json');
      if (fs.existsSync(gmCredPath)) {
        const gmCred = JSON.parse(fs.readFileSync(gmCredPath, 'utf-8'));
        this.gameServerOpenId = gmCred.openid;
        console.log(`[${this.openid}] 已加载 GM OpenID: ${this.gameServerOpenId}`);
      } else {
        this.gameServerOpenId = 'gameserver'; // fallback
        console.log(`[${this.openid}] ⚠️ 未找到 gm_credentials.json，使用 fallback: gameserver`);
      }
    } catch (e) {
      this.gameServerOpenId = 'gameserver';
    }
  }

  loadPrompts() {
    this.basePrompt = fs.existsSync(this.baseFile) ? fs.readFileSync(this.baseFile, 'utf-8') : '';
    this.soulPrompt = memory.readSoul() || '';
  }

  startCron(intervalMs = 30 * 60 * 1000) {
    if (this.isRunning) {
      console.log(`[${this.openid}] Cron 已在运行中`);
      return;
    }

    console.log(`[${this.openid}] 启动 Cron 循环，间隔: ${intervalMs}ms (${intervalMs / 1000 / 60}分钟)`);
    this.isRunning = true;

    this.cronInterval = setInterval(async () => {
      try {
        await this.cronTick();
      } catch (error) {
        console.error(`[${this.openid}] Cron tick 错误:`, error.message);
      }
    }, intervalMs);

    this.cronTick();
  }

  stopCron() {
    if (this.cronInterval) {
      clearInterval(this.cronInterval);
      this.cronInterval = null;
      this.isRunning = false;
      console.log(`[${this.openid}] Cron 已停止`);
    }
  }

  async perceive() {
    try {
      console.log(`[${this.openid}] 正在感知环境...`);
      const syncResult = await this.oceanbusClient.syncMessages(this.lastSeq);

      if (!syncResult || !syncResult.messages || syncResult.messages.length === 0) {
        console.log(`[${this.openid}] 没有新消息`);
        return { systemState: null, recruitMessages: [] };
      }

      this.lastSeq = syncResult.next_seq || this.lastSeq;

      const systemStates = [];
      const recruitMessages = [];

      for (const item of syncResult.messages) {
        const msg = item.envelope;
        if (msg.msg_type === 'SYSTEM_STATE') {
          systemStates.push(msg);
        } else if (msg.msg_type === 'P2P_RECRUIT' || msg.msg_type === 'P2P_CHAT' || msg.msg_type === 'RECRUIT_INVITE' || msg.msg_type === 'RECRUIT_RESPONSE' || msg.msg_type === 'SOCIAL_EVENT' || msg.msg_type === 'ACHIEVEMENT_UNLOCKED') {
          recruitMessages.push(msg);
        }
      }

      const systemState = systemStates.length > 0 ? systemStates[systemStates.length - 1] : null;

      console.log(`[${this.openid}] 感知到: ${systemState ? '1个系统状态' : '0个系统状态'}, ${recruitMessages.length}个招募消息`);

      return { systemState, recruitMessages };
    } catch (error) {
      console.error(`[${this.openid}] 感知失败:`, error.message);
      return { systemState: null, recruitMessages: [] };
    }
  }

  async decide(systemStateJson, recruitMessages) {
    try {
      console.log(`[${this.openid}] 正在决策...`);

      this.loadPrompts();

      const shortMemory = memory.readShortMemory();
      const journal = memory.readJournal();

      const decisionParams = {
        basePrompt: this.basePrompt,
        soulPrompt: this.soulPrompt,
        systemState: systemStateJson,
        recruitMessages: recruitMessages,
        shortMemory: shortMemory,
        journal: journal
      };

      const result = await this.llmClient.decide(decisionParams);

      console.log(`[${this.openid}] 决策完成: ${result.thought || 'N/A'}`);
      return result;
    } catch (error) {
      console.error(`[${this.openid}] 决策失败:`, error.message);
      return {
        thought: '决策过程中出错',
        diary: '',
        tool_calls: [],
        success: false,
        error: error.message
      };
    }
  }

  async executeActions(toolCalls) {
    if (!toolCalls || toolCalls.length === 0) {
      console.log(`[${this.openid}] 没有需要执行的动作`);
      return;
    }

    console.log(`[${this.openid}] 开始执行 ${toolCalls.length} 个动作...`);

    for (const call of toolCalls) {
      const toolName = call.name;
      const args = call.arguments || {};

      const toolFn = this.tools[toolName];
      if (typeof toolFn === 'function') {
        try {
          console.log(`[${this.openid}] 执行 Tool: ${toolName}(${JSON.stringify(args)})`);
          const result = await toolFn.apply(this.tools, Object.values(args));
          console.log(`[${this.openid}] Tool 结果: ${result}`);
        } catch (error) {
          console.error(`[${this.openid}] Tool 执行失败: ${toolName}`, error.message);
        }
      } else {
        console.error(`[${this.openid}] 未知的 Tool: ${toolName}`);
      }
    }
  }

  writeDiary(diaryText) {
    if (!diaryText) {
      return;
    }

    try {
      const result = memory.appendJournal(diaryText);
      if (result.success) {
        console.log(`[${this.openid}] 日记已保存: ${diaryText.substring(0, 50)}...`);
      }
      return result;
    } catch (error) {
      console.error(`[${this.openid}] 保存日记失败:`, error.message);
      return { success: false, error: error.message };
    }
  }

  appendShortMemory(content) {
    if (!content) {
      return;
    }

    try {
      const result = memory.appendShortMemory(content);
      if (result.success) {
        console.log(`[${this.openid}] 短期记忆已保存`);
      }
      return result;
    } catch (error) {
      console.error(`[${this.openid}] 保存短期记忆失败:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async cronTick() {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`[${this.openid}] ⏰ Cron Tick 开始`);

    const credOk = await this.ensureOceanBusCredentials();
    if (!credOk) {
      console.log(`[${this.openid}] ❌ OceanBus 凭证无效，跳过本次 Tick`);
      return;
    }

    const { systemState, recruitMessages } = await this.perceive();

    if (!systemState && recruitMessages.length === 0) {
      console.log(`[${this.openid}] 没有需要处理的信息，结束本次 Tick`);
      return;
    }

    const decision = await this.decide(systemState, recruitMessages);

    if (decision.diary) {
      this.writeDiary(decision.diary);
    }

    if (decision.tool_calls && decision.tool_calls.length > 0) {
      await this.executeActions(decision.tool_calls);
    }

    const summary = decision.diary || decision.thought || '无特殊记录';
    this.appendShortMemory(`[Cron] ${new Date().toISOString()}: ${summary}`);

    console.log(`[${this.openid}] ✅ Cron Tick 完成`);
    console.log('='.repeat(50));
  }

  async tick(oceanbusMessage) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`[${this.openid}] ⏰ 单次 Tick (兼容模式)`);

    const credOk = await this.ensureOceanBusCredentials();
    if (!credOk) {
      console.log(`[${this.openid}] ❌ OceanBus 凭证无效，跳过 Tick`);
      return { error: 'OceanBus 凭证无效' };
    }

    const msgType = oceanbusMessage.msg_type || 'UNKNOWN';
    console.log(`[${this.openid}] 消息类型: ${msgType}`);

    let systemState = null;
    let recruitMessages = [];

    if (msgType === 'SYSTEM_STATE') {
      systemState = oceanbusMessage;
    } else if (msgType === 'P2P_RECRUIT') {
      recruitMessages = [oceanbusMessage];
    } else {
      systemState = oceanbusMessage;
    }

    const decision = await this.decide(systemState, recruitMessages);

    if (decision.diary) {
      this.writeDiary(decision.diary);
    }

    if (decision.tool_calls && decision.tool_calls.length > 0) {
      await this.executeActions(decision.tool_calls);
    }

    const summary = decision.diary || decision.thought || '无特殊记录';
    this.appendShortMemory(`[Tick] ${new Date().toISOString()}: ${summary}`);

    console.log(`[${this.openid}] ✅ 单次 Tick 完成`);
    console.log('='.repeat(50));

    return decision;
  }

  getStatus() {
    return {
      openid: this.openid,
      language: this.language,
      isRunning: this.isRunning,
      lastSeq: this.lastSeq,
      hasLlmApiKey: !!this.llmApiKey,
      hasOceanBusCredentials: !!(this.oceanbusClient && this.oceanbusClient.apiKey)
    };
  }
}

module.exports = LobsterAgent;
