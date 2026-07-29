---
title: Hexo 博客部署到 Gitee Pages 全流程
date: 2026-07-25 14:30:00
tags:
  - Hexo
  - 教程
categories:
  - 技术
---

国内使用 Hexo 写博客，相比 GitHub Pages，更推荐部署到 **Gitee Pages**——访问速度快、部署简单。下面记录完整流程。

<!-- more -->

## 一、前置准备

- 一个 Gitee 账号（已实名认证才能开启 Pages）
- 一个形如 `<用户名>.github.io` 的公开仓库
- 本机已安装 Node.js（≥ 14）和 Git

## 二、Hexo 项目初始化

```bash
# 全局安装 hexo
npm install -g hexo-cli

# 初始化项目（独立目录）
hexo init my-blog
cd my-blog

# 安装部署插件
npm install hexo-deployer-git --save
```

## 三、配置 `_config.yml`

找到文件最下方的 `deploy` 段，改为：

```yaml
deploy:
  type: git
  repository: https://gitee.com/<用户名>/<用户名>.gitee.io.git
  branch: master
```

> ⚠️ 注意：是 `repository`，不是 `respository`，这是 Hexo 默认模板里常见的拼写错误。

## 四、配置 SSH（可选，推荐）

部署时如果不想每次都输入账号密码，可配置 SSH 公钥：

```bash
# 生成 SSH 密钥（一路回车即可）
ssh-keygen -t rsa -C "your_email@example.com"

# 复制公钥内容，添加到 Gitee 设置 → SSH 公钥
cat ~/.ssh/id_rsa.pub
```

## 五、执行部署

```bash
# 清理 + 生成 + 部署
hexo clean && hexo generate && hexo deploy
```

首次部署会要求输入 Gitee 用户名密码（或推送已被拒绝时报错）。成功后访问 `https://<用户名>.gitee.io` 即可。

## 六、常见问题

| 报错 | 解决方案 |
|------|----------|
| `fatal: not a git repository` | 项目根目录运行 `git init` |
| `Permission denied (publickey)` | 检查 SSH 公钥是否正确添加 |
| `deploy` 后访问 404 | 去 Gitee 仓库 → 服务 → Gitee Pages → 启动 |
| 部署后样式丢失 | 检查 `url` 是否配置正确，且 `theme` 存在 |

## 结语

部署到 Gitee 比 GitHub Pages 简单很多，速度也快得多，唯一的小遗憾是实名认证后才能被公网访问。瑕不掩瑜，国内使用强烈推荐。