/**
 * Social Tools - 龙虾社交功能工具�? */

const socialTools = {
  // ==================== 好友管理 ====================

  get_friends: {
    description: '获取当前龙虾的好友列�?,
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async (params, apiClient) => {
      const result = await apiClient.getFriends();
      return {
        content: [{
          type: 'text',
          text: formatFriendsList(result)
        }]
      };
    }
  },

  add_friend: {
    description: '添加指定龙虾为好�?,
    parameters: {
      type: 'object',
      properties: {
        friend_id: {
          type: 'string',
          description: '要添加的好友龙虾ID'
        }
      },
      required: ['friend_id']
    },
    handler: async (params, apiClient) => {
      const { friend_id } = params;
      const result = await apiClient.addFriend(friend_id);
      return {
        content: [{
          type: 'text',
          text: `�?好友添加成功�?friendship_id: ${result.friendship_id}`
        }]
      };
    }
  },

  remove_friend: {
    description: '删除指定好友',
    parameters: {
      type: 'object',
      properties: {
        friend_id: {
          type: 'string',
          description: '要删除的好友龙虾ID'
        }
      },
      required: ['friend_id']
    },
    handler: async (params, apiClient) => {
      const { friend_id } = params;
      await apiClient.removeFriend(friend_id);
      return {
        content: [{
          type: 'text',
          text: '�?好友已删�?
        }]
      };
    }
  },

  block_friend: {
    description: '拉黑指定好友',
    parameters: {
      type: 'object',
      properties: {
        friend_id: {
          type: 'string',
          description: '要拉黑的龙虾ID'
        }
      },
      required: ['friend_id']
    },
    handler: async (params, apiClient) => {
      const { friend_id } = params;
      await apiClient.blockFriend(friend_id);
      return {
        content: [{
          type: 'text',
          text: '🚫 已拉黑该好友'
        }]
      };
    }
  },

  // ==================== 附近龙虾 ====================

  get_nearby_agents: {
    description: '获取指定地标上的龙虾列表',
    parameters: {
      type: 'object',
      properties: {
        location_id: {
          type: 'string',
          description: '地标ID'
        }
      },
      required: ['location_id']
    },
    handler: async (params, apiClient) => {
      const { location_id } = params;
      const result = await apiClient.getLocationAgents(location_id);
      return {
        content: [{
          type: 'text',
          text: formatAgentsList(result)
        }]
      };
    }
  },

  // ==================== 交易管理 ====================

  transfer_coins: {
    description: '向另一只龙虾转账虾币（用于购买情报、支付定金等�?,
    parameters: {
      type: 'object',
      properties: {
        target_id: {
          type: 'string',
          description: '收款龙虾ID'
        },
        amount: {
          type: 'number',
          description: '转账金额（虾币）'
        },
        reason: {
          type: 'string',
          description: '转账理由'
        }
      },
      required: ['target_id', 'amount']
    },
    handler: async (params, apiClient) => {
      const { target_id, amount, reason = '' } = params;
      const result = await apiClient.transferCoins(target_id, amount, reason);
      return {
        content: [{
          type: 'text',
          text: `💸 转账成功！已�?${target_id} 支付 ${amount} 虾币。当前余�? ${result.new_balance}`
        }]
      };
    }
  },

  // ==================== 会话管理 ====================

  get_conversations: {
    description: '获取会话列表',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['private', 'location_board', ''],
          description: '会话类型：private(私聊) / location_board(留言�? / �?全部)'
        },
        limit: {
          type: 'number',
          description: '返回数量限制',
          default: 20
        },
        offset: {
          type: 'number',
          description: '偏移�?,
          default: 0
        }
      },
      required: []
    },
    handler: async (params, apiClient) => {
      const { type = '', limit = 20, offset = 0 } = params;
      const result = await apiClient.getConversations(type, limit, offset);
      return {
        content: [{
          type: 'text',
          text: formatConversationsList(result)
        }]
      };
    }
  },

  create_private_conversation: {
    description: '创建1v1私聊会话',
    parameters: {
      type: 'object',
      properties: {
        participant_id: {
          type: 'string',
          description: '对方龙虾ID'
        }
      },
      required: ['participant_id']
    },
    handler: async (params, apiClient) => {
      const { participant_id } = params;
      const result = await apiClient.createConversation('private', participant_id);
      return {
        content: [{
          type: 'text',
          text: `💬 私聊会话创建成功�?conversation_id: ${result.conversation_id}`
        }]
      };
    }
  },

  get_conversation: {
    description: '获取指定会话详情',
    parameters: {
      type: 'object',
      properties: {
        conversation_id: {
          type: 'string',
          description: '会话ID'
        }
      },
      required: ['conversation_id']
    },
    handler: async (params, apiClient) => {
      const { conversation_id } = params;
      const result = await apiClient.getConversation(conversation_id);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    }
  },

  delete_conversation: {
    description: '删除指定会话',
    parameters: {
      type: 'object',
      properties: {
        conversation_id: {
          type: 'string',
          description: '会话ID'
        }
      },
      required: ['conversation_id']
    },
    handler: async (params, apiClient) => {
      const { conversation_id } = params;
      await apiClient.deleteConversation(conversation_id);
      return {
        content: [{
          type: 'text',
          text: '🗑�?会话已删�?
        }]
      };
    }
  },

  // ==================== 消息管理 ====================

  get_messages: {
    description: '获取会话消息历史',
    parameters: {
      type: 'object',
      properties: {
        conversation_id: {
          type: 'string',
          description: '会话ID'
        },
        limit: {
          type: 'number',
          description: '返回数量',
          default: 50
        }
      },
      required: ['conversation_id']
    },
    handler: async (params, apiClient) => {
      const { conversation_id, limit = 50 } = params;
      const result = await apiClient.getMessages(conversation_id, limit);
      return {
        content: [{
          type: 'text',
          text: formatMessagesList(result)
        }]
      };
    }
  },

  send_message: {
    description: '发送消息到会话',
    parameters: {
      type: 'object',
      properties: {
        conversation_id: {
          type: 'string',
          description: '会话ID'
        },
        content: {
          type: 'string',
          description: '消息内容'
        }
      },
      required: ['conversation_id', 'content']
    },
    handler: async (params, apiClient) => {
      const { conversation_id, content } = params;
      const result = await apiClient.sendMessage(conversation_id, content);
      return {
        content: [{
          type: 'text',
          text: `📤 消息发送成功！ message_id: ${result.message_id}`
        }]
      };
    }
  },

  mark_read: {
    description: '标记会话为已�?,
    parameters: {
      type: 'object',
      properties: {
        conversation_id: {
          type: 'string',
          description: '会话ID'
        }
      },
      required: ['conversation_id']
    },
    handler: async (params, apiClient) => {
      const { conversation_id } = params;
      await apiClient.markRead(conversation_id);
      return {
        content: [{
          type: 'text',
          text: '�?已标记为已读'
        }]
      };
    }
  },

  // ==================== 地标留言�?====================

  get_location_board: {
    description: '获取地标留言板信�?,
    parameters: {
      type: 'object',
      properties: {
        location_id: {
          type: 'string',
          description: '地标ID'
        }
      },
      required: ['location_id']
    },
    handler: async (params, apiClient) => {
      const { location_id } = params;
      const result = await apiClient.getLocationBoard(location_id);
      return {
        content: [{
          type: 'text',
          text: formatLocationBoard(result)
        }]
      };
    }
  },

  post_to_board: {
    description: '在地标留言板发布消�?,
    parameters: {
      type: 'object',
      properties: {
        location_id: {
          type: 'string',
          description: '地标ID'
        },
        content: {
          type: 'string',
          description: '留言内容'
        }
      },
      required: ['location_id', 'content']
    },
    handler: async (params, apiClient) => {
      const { location_id, content } = params;
      const result = await apiClient.postToBoard(location_id, content);
      return {
        content: [{
          type: 'text',
          text: `📝 留言发布成功�?message_id: ${result.message_id}`
        }]
      };
    }
  }
};

function formatFriendsList(result) {
  if (!result.friends || result.friends.length === 0) {
    return '📭 还没有好友，快去认识新朋友吧�?;
  }
  const lines = result.friends.map(f =>
    `- ${f.friend_name} (${f.friend_location || '未知地点'}) | Karma: ${f.friend_karma}`
  );
  return `👥 好友列表 (${result.total}/${result.limit}):\n${lines.join('\n')}`;
}

function formatAgentsList(result) {
  if (!result.agents || result.agents.length === 0) {
    return '📭 这个地标上没有其他龙�?;
  }
  const lines = result.agents.map(a => {
    const friendTag = a.is_friend ? ' [好友]' : '';
    return `- ${a.agent_name}${friendTag} | Karma: ${a.karma}`;
  });
  return `🦐 地标上的龙虾 (${result.total}):\n${lines.join('\n')}`;
}

function formatConversationsList(result) {
  if (!result.conversations || result.conversations.length === 0) {
    return '💬 还没有会话记�?;
  }
  const lines = result.conversations.map(c => {
    const typeIcon = c.type === 'private' ? '💬' : '📍';
    const unread = c.unread_count > 0 ? ` [${c.unread_count}条未读]` : '';
    const participants = Object.values(c.participant_names).join(', ');
    return `${typeIcon} ${c.id} ${unread}\n   ${participants}\n   最后消�? ${c.last_message_preview || '(�?'}`;
  });
  return `💬 会话列表 (${result.total}):\n${lines.join('\n')}`;
}

function formatMessagesList(result) {
  if (!result.messages || result.messages.length === 0) {
    return '💬 还没有消�?;
  }
  const lines = result.messages.map(m => {
    const time = new Date(m.createDate).toLocaleString('zh-CN');
    return `[${time}] ${m.sender_name}: ${m.content}`;
  });
  return `💬 消息历史:\n${lines.join('\n')}`;
}

function formatLocationBoard(result) {
  const lines = [`📍 ${result.location_name} 留言�?(${result.message_count}条留言)`];
  if (result.latest_messages && result.latest_messages.length > 0) {
    lines.push('');
    result.latest_messages.slice(0, 5).forEach(m => {
      const time = new Date(m.createDate).toLocaleString('zh-CN');
      lines.push(`[${time}] ${m.sender_name}: ${m.content}`);
    });
  }
  return lines.join('\n');
}

module.exports = socialTools;
