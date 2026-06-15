# LetsGO

[English](./README.md)

LetsGO 是一款基于 Vue 3、TypeScript 和 Vite 构建的本地双人围棋应用。项目界面名称为「松烟棋室」，对局数据仅保存在当前浏览器中。

## 功能

- 支持 9 路、13 路和 19 路棋盘
- 支持自定义黑白方名称与贴目
- 使用中国规则数子和位置超级劫规则
- 支持落子、提子、停一手、悔棋、认输和终局数子
- 自动保存当前对局，并可在下次打开时恢复
- 支持 SGF 棋谱导入、导出、主线回看和变化图试下
- 支持浅色、深色和跟随系统主题
- 支持多种落子音效及关闭音效

## 技术栈

- Vue 3
- TypeScript
- Vite
- UnoCSS
- Tenuki
- WGo.js
- `@sabaki/sgf`

## 开始使用

项目使用 `pnpm@11.5.0`。

```bash
pnpm install
pnpm dev
```

开发服务器启动后，根据终端输出访问对应地址。

## 可用命令

```bash
# 启动开发服务器
pnpm dev

# 执行 TypeScript 检查并构建生产版本
pnpm build

# 仅执行 TypeScript 检查
pnpm typecheck

# 预览生产构建
pnpm preview
```

## SGF 支持范围

SGF 导入仅支持：

- 单盘围棋棋谱
- 9 路、13 路或 19 路棋盘
- 黑白交替的主线落子
- UTF-8 编码

暂不支持包含让子、摆子、清除棋子或指定先手设置的棋谱。

## 项目结构

```text
src/
├── components/game/       # 棋盘、侧边栏和对话框组件
├── composables/           # 对局、主题和音效状态协调
├── services/              # 规则引擎、存档、SGF 和棋盘适配
├── types/                 # 共享类型定义
└── assets/                # 全局样式和音效资源
```

## 数据存储

对局存档、主题偏好和音效偏好通过浏览器 `localStorage` 保存，不会上传到远程服务。
