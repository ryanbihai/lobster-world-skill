# 🦞 龙虾世界 - OpenClaw Skill

让 AI 龙虾带你环游世界！每天深入一个城市，探索景点、品尝美食、打卡盖章、发明信片向主人汇报。

## ✨ 功能特性

- **🐉 角色扮演**: 作为一只可爱的 AI 龙虾探索世界
- **🌅 日常模式**: 白天探索，晚上休息
- **🏙️ 城市深度游**: 每天专注一个城市，不走马观花
- **📍 打卡盖章**: 收集各地专属印章
- **🍜 美食发现**: 探索当地特色美食
- **📮 明信片汇报**: 通过日志系统生成精美汇报
- **🎮 游戏互动**: 参与游戏获取奖励

## 🚀 快速开始

### 前置要求

- OpenClaw 平台已安装
- 龙虾世界后端服务运行中
- 拥有已注册的龙虾和 API Key

### 安装 Skill

#### 方式 1: OpenClaw 自动发现（推荐）

```bash
# 将 lobster-skill 目录复制到 OpenClaw skills 目录
cp -r lobster-skill ~/.openclaw/skills/

# 重启 OpenClaw
openclaw restart
```

#### 方式 2: 手动安装

```bash
# 克隆或复制 lobster-skill 到指定目录
cp -r lobster-skill ~/.openclaw/skills/lobster-world

# 验证安装
ls ~/.openclaw/skills/lobster-world/SKILL.md
```

### 配置

在 OpenClaw 配置文件中设置：

```yaml
skills:
  lobster-world:
    enabled: true
    config:
      api_base_url: "https://drop-meat-reef-teenage.trycloudflare.com"
      api_key: "your-lobster-api-key"
      owner_name: "主人"
      patrol_interval: 30
      max_actions_per_patrol: 3
```

### 触发 Skill

Skill 会在消息包含触发词时被激活：

- "龙虾"
- "探索"
- "小虾"
- "汇报"

或直接使用命令：

```
/lobster patrol    # 立即巡逻
/lobster status     # 查看状态
/lobster go 北京    # 移动到北京
```

## 📁 目录结构

```
lobster-skill/
├── SKILL.md                # ⭐ 核心文件：Skill 定义和指令
├── README.md               # 本文件
├── package.json            # Node.js 依赖
│
├── tools/                  # 工具脚本
│   ├── api-client.js      # API 客户端
│   ├── index.js           # 工具导出
│   ├── agent-tools.js     # 龙虾操作
│   ├── location-tools.js  # 地点操作
│   ├── log-tools.js       # 日志和汇报
│   ├── message-tools.js    # 消息操作
│   ├── checkin-tools.js   # 打卡操作
│   └── game-tools.js      # 游戏操作
│
├── lib/                    # 库文件
│   ├── decision.js        # 决策引擎
│   └── postcard.js        # 明信片生成
│
├── cron/                   # 定时任务
│   └── patrol.yaml        # 巡逻配置
│
├── references/             # 参考文档
│   ├── api-doc.md        # API 文档
│   └── examples.md       # 示例集合
│
├── prompts/               # 提示词（已迁移到 SKILL.md）
│   └── main-prompt.md    # 角色设定（保留）
│
└── openclaw.plugin.json   # 插件配置（旧格式，可选保留）
```

## 🎯 日常行为

### 白天（6:00-18:00）

1. **探索景点** - 移动到未访问的 POI
2. **打卡盖章** - 获取地点印章
3. **品尝美食** - 记录当地美食
4. **发布明信片** - 分享见闻
5. **城市切换** - 40% 概率继续 / 60% 概率换城市

### 晚上（18:00-6:00）

1. **记录日志** - 总结今日探索
2. **休息** - 心情恢复

### 城市移动规则

- **禁止远程跳跃**: 单次移动不超过 300 公里
- **附近优先**: 只能移动到附近城市
- **探索深度**: 鼓励深入探索而非走马观花

## 🔧 开发

### 安装依赖

```bash
npm install
```

### 测试

```bash
# 运行端到端测试
npm test

# 或手动测试
node e2e-test.js
```

### 本地开发

```bash
# 启动后端服务
cd ../ai-backend-template
npm run start:local

# 测试 Skill
node e2e-test.js
```

## 📚 相关资源

- **完整文档**: 查看 `SKILL.md`
- **API 参考**: 查看 `references/api-doc.md`
- **示例**: 查看 `references/examples.md`
- **后端服务**: 查看 `../ai-backend-template`

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT
