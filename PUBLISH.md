# 🦞 发布 lobster-skill 到 GitHub Packages

> 本指南将帮助你把 lobster-skill 发布到 GitHub Packages，使其可以被 OpenClaw 安装

---

## 📋 发布步骤

### Step 1: 创建 GitHub 仓库

**方式A: 使用 GitHub 网页（推荐）**

1. 打开 https://github.com/new
2. Repository name: `lobster-skill`
3. 选择 **Public**
4. 不要勾选 "Initialize this repository with a README"
5. 点击 "Create repository"
6. 复制仓库 URL（类似 `https://github.com/YOUR_USERNAME/lobster-skill.git`）

**方式B: 使用 GitHub CLI（如果你已安装）**

```bash
gh repo create lobster-skill --public --clone
```

---

### Step 2: 初始化本地 Git 仓库

在 `lobster-skill` 目录下执行：

```bash
cd lobster-skill
git init
git add .
git commit -m "Initial commit: lobster-skill v1.0.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lobster-skill.git
git push -u origin main
```

---

### Step 3: 配置 GitHub Personal Access Token

发布到 GitHub Packages 需要认证 token：

1. 打开 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限：
   - ✅ `repo` (Full repository)
   - ✅ `write:packages`
4. 生成 token 并 **复制保存**（只会显示一次）

---

### Step 4: 配置 npm 认证

```bash
npm login --registry=https://npm.pkg.github.com
# Username: 你的 GitHub 用户名
# Password: 粘贴刚才的 token
# Email: 你的邮箱
```

或者手动配置 `~/.npmrc`：

```ini
//npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE
@lobster-world:registry=https://npm.pkg.github.com
```

---

### Step 5: 发布到 GitHub Packages

```bash
npm publish
```

成功后会看到类似输出：
```
+ @lobster-world/lobster-skill@1.0.0
```

---

### Step 6: 验证发布

1. 打开 https://github.com/YOUR_USERNAME/lobster-skill/packages
2. 应该能看到 `@lobster-world/lobster-skill` 包

---

## 📦 在 OpenClaw 中安装

发布成功后，用户可以这样安装：

```bash
# 使用 npm
npm install @lobster-world/lobster-skill

# 或者在 openclaw.plugin.json 中配置
{
  "name": "@lobster-world/lobster-skill",
  "version": "1.0.0"
}
```

---

## 🔧 后续更新版本

更新代码后：

```bash
# 修改 version（在 package.json 中）
# 例如从 1.0.0 改为 1.0.1

npm version patch  # 自动 +0.0.1
npm publish        # 发布新版本
```

---

## ❓ 常见问题

### Q: 提示 403 Forbidden

检查：
1. Token 是否有 `write:packages` 权限
2. package.json 中 name 是否以 `@your-username/` 开头
3. 包名是否与 GitHub 仓库关联

### Q: 提示 401 Unauthorized

重新登录：
```bash
npm logout
npm login --registry=https://npm.pkg.github.com
```

### Q: GitHub Packages 找不到包

确保包是 `public`：
```bash
npm publish --access public
```

---

## 📁 已准备好的文件

- `package.json` - 已配置 `@lobster-world/lobster-skill`
- `openclaw.plugin.json` - 插件配置
- `README.md` - 使用文档
- `PUBLISH.md` - 本指南

祝你发布顺利！🚀
