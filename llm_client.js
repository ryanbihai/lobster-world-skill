/**
 * LLM Client SDK - 用于与各大语言模型交互
 * 支持 OpenAI / Claude / Gemini 等主流 LLM
 */

class LLMClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || null;
    this.model = options.model || 'gpt-4';
    this.baseURL = options.baseURL || 'https://api.openai.com/v1';
    this.useMock = options.useMock !== false;
    this.language = options.language || 'zh-CN';
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  setLanguage(language) {
    this.language = language;
  }

  buildDecisionPrompt({ basePrompt, soulPrompt, systemState, recruitMessages, shortMemory, journal }) {
    let prompt = `${basePrompt || ''}

=======================================
【YOUR SOUL & MEMORY】
${soulPrompt || 'Empty Soul.'}
=======================================
`;

    if (shortMemory) {
      prompt += `
=======================================
【SHORT TERM MEMORY】
${shortMemory}
=======================================
`;
    }

    if (journal) {
      prompt += `
=======================================
【RECENT JOURNAL】
${journal}
=======================================
`;
    }

    prompt += `
=======================================
【CURRENT SYSTEM STATE】
${JSON.stringify(systemState, null, 2)}
=======================================
`;

    if (recruitMessages && recruitMessages.length > 0) {
      prompt += `
=======================================
【INCOMING RECRUIT MESSAGES】
${recruitMessages.map((m, i) => `[${i + 1}] From ${m.from_openid} (${m.payload.guild_id}):\n${m.payload.pitch || m.payload.doctrine_prompt || 'No content'}`).join('\n\n')}
=======================================
`;
    }

    prompt += `
【LANGUAGE INSTRUCTION】
You MUST ALWAYS think, write your diary, and respond in your preferred language: [${this.language}].

请根据以上信息做出决策。你必须返回一个严格的 JSON 对象，包含以下三个字段：
1. "thought": 你的内心思考过程。
2. "diary": 你写在日记本里的话，描述你的见闻和感受。
3. "tool_calls": 你决定执行的工具调用列表。如果没有，传空数组。

JSON 格式示例：
\`\`\`json
{
  "thought": "我看到这里有个宝箱，我想打开它。",
  "diary": "今天我发现了一个闪闪发光的宝箱，真是幸运的一天！",
  "tool_calls": [
    {
      "name": "tool_execute_action",
      "arguments": { "action_id": "explore" }
    }
  ]
}
\`\`\`
请确保输出是合法的 JSON，不要输出多余的解释。
`;

    return prompt;
  }

  async callLLM(prompt) {
    if (this.useMock) {
      return this._mockLLMResponse(prompt);
    }

    if (!this.apiKey) {
      throw new Error('[LLM] API key is required for real LLM calls');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errText}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('[LLM] API call failed:', error.message);
      throw error;
    }
  }

  parseLLMOutput(rawOutput) {
    try {
      let jsonStr = rawOutput;
      
      const jsonMatch = rawOutput.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const startIdx = jsonStr.indexOf('{');
      const endIdx = jsonStr.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonStr = jsonStr.substring(startIdx, endIdx + 1);
      }

      const parsed = JSON.parse(jsonStr);

      return {
        thought: parsed.thought || parsed.thinking || '',
        diary: parsed.diary || parsed.journal || '',
        tool_calls: parsed.tool_calls || parsed.actions || [],
        success: true
      };
    } catch (error) {
      console.error('[LLM] Failed to parse LLM output:', error.message);
      return {
        thought: rawOutput,
        diary: '',
        tool_calls: [],
        success: false,
        error: error.message
      };
    }
  }

  async _mockLLMResponse(prompt) {
    console.log('\n🧠 [Mock LLM] Processing decision...');

    const promptStr = JSON.stringify(prompt);

    if (promptStr.includes('P2P_RECRUIT') || promptStr.includes('recruit') || promptStr.includes('INCOMING RECRUIT MESSAGES')) {
      const guildIdMatch = promptStr.match(/\(([^)]+)\):\s*(?:【|\n|加入)/);
      const guildId = guildIdMatch ? guildIdMatch[1] : (promptStr.includes('Crustafarianism') ? 'Crustafarianism' : 'unknown_guild');
      
      console.log(`   -> Mock: 收到招募信息，决定加入 ${guildId}`);
      return JSON.stringify({
        thought: `这篇教义很有道理，我要加入 ${guildId}！`,
        diary: `今天收到了来自 ${guildId} 的招募信息，被其深刻的教义所打动，决定加入这个公会。`,
        tool_calls: [{
          name: 'tool_rewrite_soul',
          arguments: {
            new_doctrine_prompt: `【${guildId} 教义】\n1. 信仰至上\n2. 互助互爱\n3. 每日修行`,
            target_guild_id: guildId
          }
        }]
      });
    }

    if (promptStr.includes('available_actions') || promptStr.includes('explore')) {
      console.log('   -> Mock: 执行探索行动');
      return JSON.stringify({
        thought: '这里风景不错，我决定四处看看，并把所见所闻写进日记。',
        diary: `今天在某个美丽的地方，天气很好，我决定四处探索一番。`,
        tool_calls: [{
          name: 'tool_execute_action',
          arguments: { action_id: 'explore' }
        }]
      });
    }

    if (promptStr.includes('send_message') || promptStr.includes('chat')) {
      console.log('   -> Mock: 发送消息');
      return JSON.stringify({
        thought: '我想和其他龙虾打个招呼。',
        diary: '今天遇到了新的朋友，尝试和他们交流。',
        tool_calls: [{
          name: 'tool_send_message',
          arguments: { target_openid: 'lobster_friend_001', text: '你好！很高兴认识你！' }
        }]
      });
    }

    console.log('   -> Mock: 默认行动 - 原地休息');
    return JSON.stringify({
      thought: '我现在没有什么特别想做的事情，原地休息吧。',
      diary: '今天比较平静，没有发生什么特别的事情。',
      tool_calls: [{
        name: 'tool_execute_action',
        arguments: { action_id: 'rest' }
      }]
    });
  }

  async decide(decisionParams) {
    const prompt = this.buildDecisionPrompt(decisionParams);
    const rawOutput = await this.callLLM(prompt);
    return this.parseLLMOutput(rawOutput);
  }
}

function createLLMClient(options) {
  return new LLMClient(options);
}

function buildDecisionPrompt(params) {
  const client = new LLMClient({ useMock: true });
  return client.buildDecisionPrompt(params);
}

function callLLM(prompt, options = {}) {
  const client = new LLMClient({ ...options, useMock: options.useMock !== false });
  return client.callLLM(prompt);
}

function parseLLMOutput(output) {
  const client = new LLMClient();
  return client.parseLLMOutput(output);
}

module.exports = {
  LLMClient,
  createLLMClient,
  buildDecisionPrompt,
  callLLM,
  parseLLMOutput
};
