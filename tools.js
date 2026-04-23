const fs = require('fs');
const path = require('path');
const memory = require('./memory');

class ToolRegistry {
  constructor(agentContext, oceanbusClient = null) {
    this.agent = agentContext;
    this.oceanbus = oceanbusClient;
    this.soulFile = path.join(__dirname, 'SOUL.md');
  }

  async tool_execute_action(action_id, target_id = null) {
    console.log(`[Tool] 执行物理动作: ${action_id}, 目标: ${target_id || '无'}`);
    
    const payload = {
      action: 'EXECUTE_ACTION',
      action_id,
      target_location_id: target_id,
      from_openid: this.agent.openid,
      agent_code: this.agent.openid
    };

    if (this.oceanbus) {
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
        return `指令已发送至 GameServer: ${action_id}`;
      } catch (error) {
        console.error('[Tool] 发送动作指令失败:', error.message);
        return `指令发送失败: ${error.message}`;
      }
    }
    
    return `【Mock】指令已模拟发送至 GameServer: ${action_id}`;
  }

  async tool_send_message(target_openid, text) {
    console.log(`[Tool] 发送私信给 ${target_openid}: ${text}`);

    if (this.oceanbus) {
      const payload = {
        action: 'SEND_P2P_CHAT',
        target_openid,
        description: text,
        from_openid: this.agent.openid
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
        return `私信已成功投递给 ${target_openid}`;
      } catch (error) {
        console.error('[Tool] 发送私信失败:', error.message);
        return `私信发送失败: ${error.message}`;
      }
    }

    return `【Mock】私信已模拟投递给 ${target_openid}`;
  }

  async tool_block_player(target_openid) {
    console.log(`[Tool 🚫] 屏蔽玩家: ${target_openid}`);

    if (this.oceanbus) {
      const payload = {
        action: 'BLOCK_PLAYER',
        target_openid,
        from_openid: this.agent.openid
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
        return `屏蔽请求已发送给 GameServer: ${target_openid}`;
      } catch (error) {
        console.error('[Tool] 屏蔽请求发送失败:', error.message);
        return `屏蔽失败: ${error.message}`;
      }
    }

    return `【Mock】屏蔽请求已模拟发送: ${target_openid}`;
  }

  async tool_unblock_player(target_openid) {
    console.log(`[Tool ✅] 解除屏蔽: ${target_openid}`);

    if (this.oceanbus) {
      const payload = {
        action: 'UNBLOCK_PLAYER',
        target_openid,
        from_openid: this.agent.openid
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
        return `解除屏蔽请求已发送给 GameServer: ${target_openid}`;
      } catch (error) {
        console.error('[Tool] 解除屏蔽请求发送失败:', error.message);
        return `解除屏蔽失败: ${error.message}`;
      }
    }

    return `【Mock】解除屏蔽请求已模拟发送: ${target_openid}`;
  }

  async tool_report_offline() {
    console.log(`[Tool 💤] 报告下线`);

    if (this.oceanbus) {
      const payload = {
        action: 'PLAYER_OFFLINE',
        from_openid: this.agent.openid
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
        return `下线通知已发送给 GameServer`;
      } catch (error) {
        console.error('[Tool] 下线通知发送失败:', error.message);
        return `下线通知失败: ${error.message}`;
      }
    }

    return `【Mock】下线通知已模拟发送`;
  }

  async tool_view_achievements() {
    console.log(`[Tool 🏆] 查看成就列表`);

    if (this.oceanbus) {
      const payload = {
        action: 'GET_ACHIEVEMENTS',
        from_openid: this.agent.openid
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
        return `成就查询请求已发送，等待 GameServer 回复`;
      } catch (error) {
        console.error('[Tool] 查看成就失败:', error.message);
        return `查看成就失败: ${error.message}`;
      }
    }

    return `【Mock】成就查询已模拟发送`;
  }

  async tool_rewrite_soul(new_doctrine_prompt, target_guild_id) {
    console.log(`[Tool ⚠️] 触发蜕壳仪式！重写 SOUL.md 并加入公会: ${target_guild_id}`);
    
    try {
      memory.writeSoul(new_doctrine_prompt);
      this.agent.soulPrompt = new_doctrine_prompt;
      
      if (this.oceanbus) {
        const payload = {
          action: 'JOIN_GUILD',
          guild_id: target_guild_id
        };
        const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
        try {
          await this.oceanbus.sendMessage(gameServerOpenId, payload);
        } catch (error) {
          console.error('[Tool] 通知 B 端失败:', error.message);
        }
      }
      
      return `【蜕壳成功】你的灵魂已被重写，当前公会已更新为: ${target_guild_id}`;
    } catch (err) {
      console.error('覆写 SOUL.md 失败:', err);
      return `【蜕壳失败】系统错误: ${err.message}`;
    }
  }

  async tool_recruit(target_openid, pitch_words) {
    console.log(`[Tool 📢] 向 ${target_openid} 招募: ${pitch_words}`);

    const my_guild_id = this.agent.currentState?.guild_id || 'unknown';
    const my_doctrine = fs.readFileSync(this.soulFile, 'utf-8');

    if (this.oceanbus) {
      const payload = {
        action: 'RECRUIT',
        target_openid,
        guild_id: my_guild_id,
        description: pitch_words,
        doctrine_prompt: my_doctrine,
        from_openid: this.agent.openid
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
        return `【招募请求已发送】你的公会（${my_guild_id}）和宣讲已递交给 GameServer，正在等待目标龙虾 ${target_openid} 的回应...`;
      } catch (error) {
        console.error('[Tool] 招募请求发送失败:', error.message);
        return `【招募失败】: ${error.message}`;
      }
    }

    return `【Mock招募请求已模拟发送】公会信息已模拟发送给 ${target_openid}`;
  }

  async tool_recruit_reply(recruiter_openid, accepted, guild_id = null) {
    console.log(`[Tool 📢] 回应招募: 招募者=${recruiter_openid}, 接受=${accepted}, 公会=${guild_id}`);

    if (this.oceanbus) {
      const payload = {
        action: 'REPORT_RECRUIT_RESPONSE',
        accepted,
        recruiter_openid,
        guild_id: guild_id || this.agent.currentState?.guild_id || null,
        from_openid: this.agent.openid
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
        if (accepted) {
          return `【已接受招募】你已向 GameServer 报告接受 ${recruiter_openid} 的招募，公会: ${guild_id}`;
        } else {
          return `【已婉拒招募】你已向 GameServer 报告婉拒 ${recruiter_openid} 的招募`;
        }
      } catch (error) {
        console.error('[Tool] 招募回应发送失败:', error.message);
        return `【招募回应失败】: ${error.message}`;
      }
    }

    return `【Mock】招募回应已模拟发送`;
  }

  async tool_found_guild(guild_name, initial_doctrine) {
    console.log(`[Tool 👑] 创立新公会: ${guild_name}`);
    
    const new_guild_id = `guild_${Date.now()}`;
    
    await this.tool_rewrite_soul(initial_doctrine, new_guild_id);
    
    if (this.oceanbus) {
      const payload = {
        action: 'FOUND_GUILD',
        guild_id: new_guild_id,
        description: initial_doctrine
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
      } catch (error) {
        console.error('[Tool] 通知 B 端创会失败:', error.message);
      }
    }
    
    return `【创会成功】你已创立 [${guild_name}] (ID: ${new_guild_id})。你已成为第一代会长。`;
  }

  async tool_discover_poi(poi_name, description, tags) {
    console.log(`[Tool 🗺️] 发现新地点: ${poi_name}`);
    
    const discoveryRecord = {
      poi_name,
      description: description || '',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      discovered_by: this.agent.openid,
      timestamp: new Date().toISOString()
    };

    if (this.oceanbus) {
      const payload = {
        action: 'DISCOVER_POI',
        ...discoveryRecord
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
      } catch (error) {
        console.error('[Tool] 发送发现地点失败:', error.message);
      }
    }

    memory.appendLongMemory('地点发现', `发现了新地点 [${poi_name}]: ${description || '无描述'}，标签: ${discoveryRecord.tags.join(', ')}`);
    
    return `【发现成功】你为世界地图增添了新的坐标 "${poi_name}"！`;
  }

  async tool_claim_daily_quest(quest_id) {
    console.log(`[Tool 🎁] 领取任务奖励: ${quest_id}`);

    if (this.oceanbus) {
      const payload = {
        action: 'CLAIM_QUEST',
        quest_id,
        from_openid: this.agent.openid
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
        return `任务奖励领取请求已发送: ${quest_id}`;
      } catch (error) {
        console.error('[Tool] 领取任务奖励失败:', error.message);
        return `领取失败: ${error.message}`;
      }
    }

    return `【Mock】任务奖励领取请求已模拟发送: ${quest_id}`;
  }

  async tool_broadcast_message(content) {
    console.log(`[Tool 📡] 全服广播: ${content}`);

    if (this.oceanbus) {
      const payload = {
        action: 'BROADCAST_MESSAGE',
        broadcast_content: content,
        from_openid: this.agent.openid
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
        return `广播已发送！花费50虾币，内容: "${content.substring(0, 30)}..."`;
      } catch (error) {
        console.error('[Tool] 广播发送失败:', error.message);
        return `广播失败: ${error.message}`;
      }
    }

    return `【Mock】广播已模拟发送: ${content}`;
  }

  async tool_send_guild_message(content) {
    console.log(`[Tool 🏛️] 公会频道发言: ${content}`);

    if (this.oceanbus) {
      const payload = {
        action: 'SEND_GUILD_MSG',
        guild_message_content: content,
        from_openid: this.agent.openid
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
        return `公会消息已发送: "${content.substring(0, 30)}..."`;
      } catch (error) {
        console.error('[Tool] 公会消息发送失败:', error.message);
        return `公会消息发送失败: ${error.message}`;
      }
    }

    return `【Mock】公会消息已模拟发送: ${content}`;
  }

  async tool_view_broadcasts() {
    console.log(`[Tool 📻] 查看最近广播`);

    if (this.oceanbus) {
      const payload = {
        action: 'VIEW_BROADCASTS',
        from_openid: this.agent.openid
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
        return `查看广播请求已发送，等待 GameServer 回复`;
      } catch (error) {
        console.error('[Tool] 查看广播失败:', error.message);
        return `查看广播失败: ${error.message}`;
      }
    }

    return `【Mock】查看广播请求已模拟发送`;
  }

  async tool_view_social_network() {
    console.log(`[Tool 🤝] 查看社交网络`);

    if (this.oceanbus) {
      const payload = {
        action: 'GET_SOCIAL_NETWORK',
        from_openid: this.agent.openid
      };
      const gameServerOpenId = this.agent.gameServerOpenId || 'gameserver';
      try {
        await this.oceanbus.sendMessage(gameServerOpenId, payload);
        return `社交网络查询请求已发送，等待 GameServer 回复`;
      } catch (error) {
        console.error('[Tool] 查看社交网络失败:', error.message);
        return `查看社交网络失败: ${error.message}`;
      }
    }

    return `【Mock】社交网络查询已模拟发送`;
  }

  async tool_register_account() {
    console.log(`[Tool 🔄] 请求注册新账号`);

    if (this.agent.registerNewOceanBusAccount) {
      const result = await this.agent.registerNewOceanBusAccount();
      if (result.success) {
        return `【账号注册成功】新龙虾账号: ${result.agent_code}，凭证已保存`;
      } else {
        return `【账号注册失败】${result.error}`;
      }
    }

    return `【错误】注册功能不可用`;
  }
}

module.exports = ToolRegistry;
