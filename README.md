# Lightchain SaaS v5.3 · 万能穿搭融合

独立的交互评审项目，使用 React 19、TypeScript、Vite 7 和 Tailwind CSS 4，按 Lightchain v5.3 Figma 设计与 v5.1 Beta 组件库实现。

## 本地运行

```sh
npm ci
npm run dev -- --port 4173
```

打开 http://127.0.0.1:4173/ 。生产构建使用 `npm run build`；构建后可运行 `npm run preview -- --port 4173`。

## 当前交互

- 画布初始化：五个功能入口；一键融合、定向融合、内衣试衣、转3D平铺直接展示对应工作流示例，抠图保留单选素材流程。内衣试衣带 NEW 标签，独立上传区支持批量添加。

- 无限画布：上传、拖动、框选、缩放、网格吸附、辅助线、整理画布、小地图、删除、撤销与重做。
- 工作流节点：一键融合最多四张参考图，定向融合最多三个融合点，内衣试衣最多一张模特参考；转3D平铺支持上装／下装／连身装和正背面选择。同一主图可创建多个独立编辑器，删除主图保留空节点并支持补图。
- 抠图编辑：画笔、加减选区、框选、套索、钢笔多边形选区、笔触大小和本地透明图片导出；结果与原图连线。
- 提示词：全屏展开编辑、调整编辑区尺寸、保存、搜索、新增、编辑、删除；支持嵌套打开提示词库并返回编辑器。
- 提示词关联图片：含三条评审演示记录；按提示词身份和生成时原文匹配，另存新条目不会继承旧图。
- 深浅主题、组件状态、Tab 导航焦点与 200ms 缓出动效。

- 演示生成：按功能条件添加对应固定示例结果（示例素材及提示词后补）并连接实际编辑器，宽360且保持原图比例。一键融合要求主图及指令，定向融合要求主图及至少一个融合点，内衣试衣／转3D平铺要求主图；无真实 AI 请求、任务或扣费。
- 图片操作：右键下载／复制／复制并粘贴／删除，快捷键文字无底色容器；生成或选择图片后 Delete／Backspace 可删除，文本输入继续保持编辑保护。
- 整理画布：按真实连接分层，同源编辑器同列、后续步骤向右延伸；独立图片另区摆放。详见 [布局交付规则](docs/canvas-layout-and-fit.md)。

## 数据与服务边界

这是前端交互演示，AI 融合生成、智能搜图、远程素材库及真实生成历史尚未接入后端。演示图片与关联记录不代表真实账号历史。手动抠图导出在浏览器本地完成。

画布图片保存在当前页面会话，刷新后清空；提示词库、项目名称和部分偏好通过当前浏览器 localStorage 保存，不随 Git 仓库同步。

## 设计来源

- [Lightchain SaaS v5.3](https://www.figma.com/design/lDDzsXpslev95eZ1ZpAHVt)
- [Lightchain v5.1 libraries Beta](https://www.figma.com/design/FO7bCfBv6NPle8egsVaDvG)

`docs/` 保留各次设计来源和组件记录；`AGENTS.md` 记录最新交互约定。图片与图标资源位于 `public/assets/`。

## 目录

- `src/`：组件、画布状态、主题 token 与样式。
- `public/`：运行时静态资源。
- `tests/`：画布行为检查。
- `docs/`：设计与实现来源。
- `artifacts/`：历史视觉检查截图和记录。

## 在线演示

[打开 GitHub Pages 演示](https://emeiiixxx.github.io/lightchain-saas-v5.3/)

推送到 main 后，GitHub Actions 自动构建和部署。`node scripts/build-pages.mjs` 使用项目子路径构建，并处理演示素材的静态资源路径；本地开发地址不变。

## 产品文档

- [SaaS v5.3 产品需求文档](https://lightchain.feishu.cn/wiki/WpiswINzhiJLCxkrmZncdhRenxb)
- [本地 Markdown 版本](docs/SaaS-v5.3-产品需求文档.md)
- [画布与提示词功能规则总结](docs/画布与提示词功能规则总结.md)

- [画布初始化详细说明与验收](docs/canvas-initialization.md)
- [工作流示例与素材说明](docs/workflow-examples.md)
