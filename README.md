# skylineoflee.github.io

古道青阳 的个人博客，基于 Hexo + Fluid 主题构建，托管在 GitHub Pages。

## 简介

记录学习笔记、技术分享和生活感悟。

主要内容包括：

- 📚 学习笔记与读书摘抄
- 💻 JavaScript / 前端技术笔记
- 🌱 生活随想
- 🎮 游戏 / 视频 / 项目展示

## 技术栈

- **静态站点生成器**: [Hexo](https://hexo.io/) 7.x
- **主题**: [Fluid](https://hexo.fluid-dev.com/)
- **托管平台**: [GitHub Pages](https://pages.github.com/)
- **CI/CD**: GitHub Actions（推送到 `main` 分支自动部署）
- **评论系统**: [Giscus](https://giscus.app)（基于 GitHub Discussions）
- **访问统计**: [Umami Analytics](https://umami.is)
- **数学公式渲染**: KaTeX

## 功能特性

- ✅ 深色模式（默认跟随系统偏好）
- ✅ 本地搜索
- ✅ 代码高亮 + 一键复制
- ✅ 文章目录（TOC）+ 锚点导航
- ✅ 字数统计 + 阅读时长估算
- ✅ 图片懒加载 + 点击放大
- ✅ Open Graph 社交分享元信息
- ✅ 赛博朋克风格自定义首页
- ✅ 打字机副标题动画
- ✅ 加载进度条

## 目录结构

```
├── _config.yml              # Hexo 全局配置
├── _config.fluid.yml        # Fluid 主题配置
├── CNAME                    # GitHub Pages 自定义域名（当前为空）
├── package.json             # 项目依赖与脚本
│
├── .github/workflows/
│   └── static.yml           # GitHub Actions CI/CD
│
├── scaffolds/               # 新建内容模板
│   ├── draft.md
│   ├── page.md
│   └── post.md
│
├── source/
│   ├── _posts/              # 博客文章
│   │   ├── first-blog-thinking.md
│   │   ├── js-tips.md
│   │   ├── hexo-deploy-github.md
│   │   └── hello-world.md
│   ├── about/index.md       # 关于页
│   ├── _styl/               # Stylus 源文件
│   │   └── custom-home.styl
│   ├── css/                 # 编译后的 CSS
│   │   └── custom-home.css
│   └── img/                 # 图片资源
│
└── themes/fluid/            # Fluid 主题源码（含 layout / scripts / source）
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
```

### 新建文章

```bash
hexo new "文章标题"
```

### 图片转换为 WebP

使用 Pillow 将 PNG 图片转换为 WebP，先安装依赖：

```bash
pip install Pillow
```

在项目根目录执行：

```bash
python -c "from PIL import Image; Image.open('source/img/input.png').convert('RGBA').save('source/img/output.webp', 'WEBP', quality=80, method=6)"
```

将 `input.png` 和 `output.webp` 替换为实际文件名。转换后可检查文件格式和大小：

```bash
python -c "from PIL import Image; from pathlib import Path; p=Path('source/img/output.webp'); im=Image.open(p); print(im.format, im.size, p.stat().st_size)"
```

> 不要只修改文件扩展名。PNG 重命名为 `.webp` 后仍然是 PNG，必须经过实际编码转换。

### 生成静态文件
npm run build
# 或
hexo generate
```

### 部署

项目通过 GitHub Actions 自动部署：

- 推送到 `main` 分支后触发
- 工作流见 `.github/workflows/static.yml`
- 输出路径为 `public/`

如需手动部署到 GitHub Pages，可运行：

```bash
npm run clean && npm run build
```

然后将 `public/` 目录内容上传至 GitHub Pages 对应分支。

---

更多详细内容请参考 [官方指南](https://hexo.fluid-dev.com/docs/)。