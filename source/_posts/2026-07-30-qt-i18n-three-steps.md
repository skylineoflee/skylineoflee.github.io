---
title: Qt 国际化三部曲：标记、提取、加载，一文搞定
date: 2026-07-30 14:00:00
tags:
  - Qt
  - 国际化
  - i18n
  - 笔记
categories:
  - 技术
visits: 0
---

Qt 的国际化（i18n）并非简单的文本替换，而是一套与编译器、操作系统、文本引擎深度耦合的系统工程。本文带你走完从 `tr()` 到屏幕的完整旅程，彻底理解 **标记 → 提取 → 加载** 这核心三部曲，同时深入工具链内幕与最佳实践。

<!-- more -->

## 一部曲 · 标记：在源码中埋下「可翻译」的种子

国际化始于开发者对源码中用户可见字符串的标注。这一步的核心是使用特定的宏/函数包裹文本，让后续工具能够识别。

### C++ 中的 `tr()` 与 `QT_TR_NOOP()`

- <strong><code>tr()</code></strong>：继承自 `QObject` 的类中可用。它会自动捕获类名作为上下文（Context），并支持复数（`%n`）和占位符（`%1`）。
- <strong><code>QT_TR_NOOP()</code></strong>：仅用于标记，但不立即翻译。通常搭配 `qtTrId()` 在别处统一翻译，适合集中管理字符串表。

> 💡 `tr("Open", "file menu")` 中的第二个参数为翻译人员提供上下文，极大提升翻译准确性。

```cpp
// 示例：C++ 中的标记
class MainWindow : public QMainWindow {
    Q_OBJECT
    void setupUI() {
        label->setText(tr("Hello", "greeting"));
        // 带占位符和复数
        statusBar()->showMessage(tr("%n file(s) loaded", "plural", count));
    }
};
```

### QML 中的 `qsTr()` 与 `qsTrId()`

- <strong><code>qsTr()</code></strong>：QML 中的标准标记函数。上下文由 QML 引擎自动生成（基于文件路径，如 `qrc:/main.qml`）。
- <strong><code>qsTrId()</code></strong>：基于 ID 的翻译，与文本内容解耦，适合大型项目或需要严格术语管理的场景。
- **动态绑定**：QML 中 `text: qsTr("Hello")` 会随语言切换自动刷新（需调用 `QQmlEngine::retranslate()`）。

```qml
// QML 标记示例
Text {
    text: qsTr("Welcome")
}
// 带 ID 的翻译
Text {
    text: qsTrId("welcome-message")
}
```

> 🌟 **黄金法则**：源文本始终使用英文（或一种基准语言），其他语言通过翻译文件映射。避免直接在源码中写中文/日文等作为源文本，否则翻译流程会变得混乱。

---

## 二部曲 · 提取：`lupdate` 与 `.ts` 翻译源文件

标记完成后，需要将分散在源码中的文本提取出来，形成可供翻译人员处理的文件。这一步由 `lupdate` 工具完成。

### `lupdate` 的工作原理

- **静态解析**：`lupdate` 扫描所有 `.cpp`、`.qml` 文件，通过词法/语法分析（支持 Clang AST 模式）精准识别 `tr()`、`qsTr()` 等调用。
- **生成 `.ts` 文件**：输出一个 XML 格式的翻译源文件（.ts），包含上下文、源文本、注释、行号，以及一个空的 `<translation>` 标签等待填写。
- **增量更新**：如果 `.ts` 已存在，`lupdate` 会智能比对，只新增或标记为"过时"（obsolete），已有的翻译不会丢失。

```bash
# 手动运行 lupdate（通常由 CMake 自动调用）
lupdate myapp.pro -ts myapp_zh.ts myapp_de.ts
```

### `.ts` 文件结构（XML 片段）

```xml
<context>
    <name>MainWindow</name>
    <message>
        <source>Hello</source>
        <comment>greeting</comment>
        <translation type="unfinished"></translation>
    </message>
</context>
```

> 🧠 **Clang 模式**：对于复杂的 C++ 模板或宏，可使用 `lupdate -clang-parser` 启用基于 Clang AST 的解析，准确率更高。

---

## 三部曲 · 加载：`QTranslator` 与 `.qm` 的运行时魔法

翻译完成后，需要将 `.ts` 编译为 `.qm`，并在运行时加载。这一步是国际化生效的临门一脚。

### `lrelease`：将 `.ts` 编译为 `.qm`

- **过滤**：默认只打包状态为"已完成"的翻译，避免半成品流出。
- **优化**：生成紧凑的二进制哈希表，运行时查找速度极快（O(1)）。
- **选项**：`-compress` 压缩，`-removeidentical` 移除与源文本相同的翻译。

```bash
# 生成 .qm 文件
lrelease myapp_zh.ts -qm myapp_zh.qm
```

### `QTranslator` 加载与安装

在 `main()` 中创建 `QTranslator` 对象，加载 `.qm` 文件，然后安装到 `QApplication`。

- **翻译器栈**：支持多个翻译器叠加，按栈顺序查找。
- **动态切换**：卸载旧翻译器、安装新翻译器，并手动刷新 UI（发送 `LanguageChange` 事件或调用 `retranslate()`）。

```cpp
// main.cpp 加载翻译
QApplication app(argc, argv);
QTranslator translator;
if (translator.load("myapp_zh.qm")) {
    app.installTranslator(&translator);
}

// 动态切换示例
void switchLanguage(const QString &lang) {
    qApp->removeTranslator(&oldTranslator);
    newTranslator.load("myapp_" + lang + ".qm");
    qApp->installTranslator(&newTranslator);
    // 刷新所有 UI 控件
    QEvent event(QEvent::LanguageChange);
    QApplication::sendEvent(mainWindow, &event);
}
```

> ⚠️ **关键点**：`QTranslator` 只拦截 `tr()/qsTr()` 调用。硬编码的字符串（如 `setText("Hello")`）**不会**被翻译。动态切换语言后，必须手动触发 UI 刷新，否则界面仍显示旧文本。

---

## 工具链全景 · 四把利器各司其职

| 工具         | 输入            | 输出              | 核心职责                                          |
| ------------ | --------------- | ----------------- | ------------------------------------------------- |
| `lupdate`    | `.cpp` / `.qml` | `.ts`（翻译源）   | 提取所有可翻译文本，生成/更新 `.ts` 文件          |
| Qt Linguist  | `.ts`           | `.ts`（已翻译）   | 可视化翻译编辑器，支持上下文、占位符保护、术语表 |
| `lrelease`   | `.ts`           | `.qm`（二进制）   | 编译 `.ts` 为高效二进制哈希表，过滤未完成翻译     |
| `lconvert`   | `.ts` / `.po` / `.xlf` | `.ts` / `.po` | 格式转换，与外部翻译生态（Crowdin、Poedit）互通   |

> ⚙️ **CMake 自动化**：在 Qt 6 中，通过 `qt_add_translations` 可一键管理 `.ts` 生成、`.qm` 编译及资源嵌入，无需手动调用工具。

---

## 进阶 · 区域习惯与复杂书写系统

国际化不只是翻译文本，还包括 **日期/数字/货币格式**（由 `QLocale` 处理）以及 **从右到左（RTL）** 和 **CJK 换行** 等复杂文本布局。

- <strong><code>QLocale</code></strong>：优先读取操作系统区域设置，并内置 CLDR 数据作为回退，实现跨平台一致性。
- **文本引擎**：`QTextLayout` 内置了 Unicode BiDi 算法，自动处理阿拉伯语、希伯来语等 RTL 脚本。
- **字体回退**：当当前字体缺少某些字符时，Qt 会自动从系统字体中查找合适的字形。

---

## 总结 · 三部曲闭环

```text
源码标记 (tr/qsTr)
        │
        ▼
  lupdate 提取
        │
        ▼
      .ts 文件
        │
        ▼
  Qt Linguist 翻译
        │
        ▼
  lrelease 编译
        │
        ▼
      .qm 文件
        │
        ▼
  QTranslator 加载
        │
        ▼
     界面显示
```

每一步都环环相扣，共同构成 Qt 国际化这套**高效、解耦、可协作**的完整体系。掌握这三部曲，你就能轻松驾驭多语言应用的开发与维护。