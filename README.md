# skylineoflee.github.io

古道青阳 的个人博客，基于 Hexo + Fluid 主题构建，托管在 [GitHub Pages](https://pages.github.com/)。

## 简介

记录学习笔记、技术分享和生活感悟。

主要内容包括：

- 📚 学习笔记与技术分享（Qt / 密码学 / 字符编码 / 前端）
- 💻 开源项目展示（Gitee 托管）
- 🎮 游戏 / 视频 / 生活随想

## 技术栈

- **静态站点生成器**: [Hexo](https://hexo.io/) 7.x
- **主题**: [Fluid](https://hexo.fluid-dev.com/)（已做深度定制，含自定义首页模块）
- **托管平台**: [GitHub Pages](https://pages.github.com/)
- **CI/CD**: GitHub Actions（`.github/workflows/static.yml`，推送到 `main` 分支自动构建部署）
- **统计**: 不蒜子（busuanzi，无需注册）footer 真实 PV/UV + 文章阅读量（localStorage 自嗨计数）

## 功能特性

- ✅ 永久深色模式（无明暗切换）
- ✅ 本地搜索
- ✅ 代码高亮 + 一键复制
- ✅ 文章目录（TOC）+ 锚点导航
- ✅ 字数统计 + 阅读时长估算
- ✅ 图片懒加载 + 点击放大
- ✅ Open Graph 社交分享元信息
- ✅ 赛博朋克风格自定义首页（博客 / 项目 / 视频 / 游戏 / 友链 五大模块）
- ✅ 加载进度条
- ✅ 404 页面自动跳转首页

## 目录结构

```
├── _config.yml              # Hexo 全局配置
├── _config.fluid.yml        # Fluid 主题配置（含自定义首页模块 home.modules）
├── .github/workflows/
├── .gitattributes           # 统一 LF 行尾 + UTF-8 声明，避免跨平台乱码
├── package.json             # 项目依赖与脚本
├── compile-css.bat          # Windows 编译自定义样式脚本（styl → css）
│
├── scaffolds/               # 新建内容模板
│   ├── draft.md
│   ├── page.md
│   └── post.md
│
├── source/
│   ├── _posts/              # 博客文章（Markdown）
│   ├── about/index.md       # 关于页
│   ├── _styl/               # Stylus 源文件
│   │   └── custom-home.styl # 首页模块样式（赛博朋克风）
│   ├── css/                 # 编译后的 CSS
│   │   └── custom-home.css  # 站点实际引用的样式产物
│   ├── js/                  # 自定义前端脚本
│   │   ├── site-pv-uv.js    # 站点 PV/UV 计数
│   │   └── post-visits.js   # 文章阅读量
│   └── img/                 # 图片资源（WebP / SVG）
│
└── themes/fluid/            # Fluid 主题源码（vendored，含 layout 自定义）
```

## 使用方式

### 安装依赖

```bash
npm install
```

### 本地预览

```bash
npm run server
# 或
hexo server
# Windows 下可直接运行 restart-hexo.bat
```

### 新建文章

```bash
hexo new "文章标题"
```

### 自定义首页样式

首页模块样式源文件位于 `source/_styl/custom-home.styl`，修改后需编译为 CSS：

**Windows 双击 `compile-css.bat`**（自动执行：styl → 编译 → 写入 `source/css/custom-home.css`），或手动：

```bash
npx hexo render source/_styl/custom-home.styl --silent > source/css/custom-home.css
```

> 站点通过 `custom_css: [/css/custom-home.css]`（根目录 `_config.fluid.yml`）引入编译产物。
> 注意：`hexo render` 把 CSS 输出到 **stdout**（不写 public/），必须手动重定向到 `source/css/custom-home.css`；
> 且必须加 `--silent`，否则 stdout 里会混入带 ANSI 色码的日志行，污染 CSS 导致浏览器解析失败。
> ⚠ 所有源文件（.styl/.md/.yml 等）请保持 **UTF-8 无 BOM** 编码，行尾统一 LF（`.gitattributes` 已声明），避免跨平台 diff 乱码。

### 生成静态文件

```bash
npm run build
# 或
hexo generate
```

### 部署

项目通过 GitHub Actions 自动部署（已配置 `.github/workflows/static.yml`）：

- 推送到 `main` 分支后触发
- CI 流程：`actions/checkout@v4` → `setup-node@v4`（Node 20）→ `npm ci` → `hexo clean` → `hexo generate`
- 输出路径为 `public/`（作为 Pages artifact 上传并发布）

> 远程仓库 `origin` 即 GitHub（`github.com/skylineoflee/skylineoflee.github.io.git`），推送到 `main` 分支即触发 Pages 自动构建。

如需手动构建：

```bash
npm run clean && npm run build
```

---

更多详细内容请参考 [Fluid 官方指南](https://hexo.fluid-dev.com/docs/)。
