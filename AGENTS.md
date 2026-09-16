# 项目交互规则

- 产品版本统一为 SaaS v5.3，包版本为 5.3.0；仓库名及 GitHub Pages 路径统一为 `lightchain-saas-v5.3`。Lightchain SaaS v5.1 libraries Beta 是组件库依赖版本，保持原标识。

- UI 组件与图标以 Lightchain SaaS v5.1 libraries Beta 为准；不得引入旧版组件或用文字字符代替已有图标。
- 普通交互动效统一为 `200ms ease-out`，集中维护在 `src/motion.css`。新交互必须沿用此规则，菜单、弹层与提示的退出需保留完整动画后再卸载。
- 直接拖拽实时跟随指针；系统 `prefers-reduced-motion` 优先。画布镜头平移、缩放与适应视图立即同步，状态切换沿用统一曲线。
- 菜单选项之间间隔 8px；选中勾使用组件库 `Icon/System / Style=Linear, Name=check` 原始资源。
- 同时兼容深浅主题，颜色沿用语义 token；局部修正不改动无关布局。
- 右下角整理／教程／快捷键按钮共用「容器＋Ghost」结构：容器使用 Surface/default、Border/weak 与阴影；按钮默认透明，悬停在容器上叠加 State/hover，图标默认 Text/secondary、悬停 Text/primary。不得把容器底色直接放到按钮上再用半透明 hover 替换。小地图和网格吸附使用独立 ToggleButton，不能套此 Ghost 或互斥工具选中态。
- 初始化功能入口使用 Figma `50:24161` 单选素材弹窗。图片悬停显示暗色蒙版，底部滑入 5.1 Beta Primitive「使用」按钮；不显示勾选框或底部确认栏。点击「使用」直接替换画布主图并关闭弹窗；主图最多 1 张，多张拖入须提示并拒绝，关闭弹窗不修改画布。

- 初始化四个功能按钮下方的上传区（`62:27018`，桌面 624×360）及画布工具栏上传入口打开 Figma `17:1333` 多选弹窗。单次最多 20 张，展示 `0 / 20`、组件库勾选框及取消/确认按钮；本地批量上传自动加入本次选择，超出剩余额度拒绝该批次，确认追加普通素材到画布并支持整批撤销，不替换已有主图。四个功能入口仍用 `50:24161` 单选流程。

- 上传后画布样式以 Figma 单图 `57:25504`、多图 `57:24422` 为准。批量上传自动选中本批图片；选中 1 张显示单图工具栏，超过 1 张显示蓝色虚线组框、20% 蓝色蒙版与多图工具栏。图片自身使用 2px Border/brand、16px 圆角，工具栏位于选区上方 16px 并跟随视图。选择工具支持空白框选、Shift 多选和整组拖动；抓手/空格平移。撤销与重做恢复图片及选区。

- 初始化最新文案为「从下方选择一个功能或添加图片，开启您的创作」。四个功能按钮后接独立的大上传区；点击打开多选窗口，拖入直接添加并自动选中本批图片。上传格式为 JPG/JPEG/PNG/WebP，单张最多 20 MB。

- 上传框状态以 5.1 Beta 母版 `794:8931` 为准：default 使用 State/default + Border/weak，hover 使用 State/hover + Border/strong，dragging 使用 Alpha/brand/20% + Border/brand；禁用文字与图标使用 Text/disabled。不得把普通 hover 与 dragging 合并成同一种主题色样式。初始化与素材选择弹窗共享此规则。

- 图片右上角「查看大图」使用 5.1 Beta IconButton / Tonal / M（default `139:1673`、hover `139:1682`），深浅模式均为黑色 60% 默认底、黑色 75% 悬停底及白色图标。按钮只属于所在图片的图层，不得跨图片置顶；按钮、图标、圆角与边距均随画布缩放，不做反向缩放。

- 所有纯图标按钮统一使用 5.1 Beta Tooltip `406:2959`，不用浏览器原生 title 提示。包含禁用按钮与弹窗关闭按钮，支持悬停、键盘聚焦、Escape 关闭、边缘避让；深浅模式均为黑色 75% 底、白字、6px 圆角，普通动效沿用 200ms ease-out。

- 缩放菜单以 `57:27017` 为准：112×300、内边距 8px、条目高 32px／间隔 4px，在 144×40 缩放控件上方 4px 居中展开。倍率按 200%、100%、50%、30%、10%、5%、3% 排列，末项「适应屏幕」；勾选跟随真实倍率，最低支持 3%。百分比框 focus／展开用 Control/fill/focus + 1px Border/brand；选项使用 State/hover + Text/brand 和组件库勾号。

- 小地图按画布图片的真实坐标和尺寸等比投影，使用中性灰色块显示轮廓与位置分布，禁止主题色铺满或分别拉伸横纵比例。灰色可视框跟随画布平移、缩放和窗口尺寸。拖动可视框平移画布，点击框外定位，缩放比例保持不变；拖拽期间固定小地图投影，画布实时跟手。支持方向键平移。

- 画布存在节点但当前视窗与所有节点均无交集时，在底部工具栏上方显示「当前视窗没有节点，可点击按钮快速回到内容区域」及「回到节点」Primary 按钮。点击使用全部节点边界适应视窗；节点重新可见后提示按 200ms ease-out 退出。空画布不显示，节点部分可见不显示；随平移、缩放、小地图导航、窗口尺寸与节点变化更新。

- 选择／抓手等互斥工具处于选中状态时，悬停保持选中底色与图标颜色，只显示 Tooltip；通用 Ghost hover 排除 aria-pressed=true，且不得提高通用规则优先级而覆盖 Select focus 等组件状态。

- 全屏大图以 `68:27657` 为准：全视窗 Overlay/scrim + 50px 毛玻璃，图片初始居中等比适配至最大 800×800，上方操作提示、右上角 32px 关闭按钮。滚轮围绕指针缩放，拖动直接平移图片，Esc／关闭退出；不改变底层画布视图、图片位置或选区，重新打开重置大图视图。沿用 200ms ease-out 与 Tooltip。

- 一键融合状态以 `35:6234`、工作流节点 `35:6422` 为准：初始化一键融合上传主图后自动进入；单图顶部工具栏入口使用当前图片，不重复添加图片或融合节点。280px 节点位于主图右侧，使用真实主图缩略图、参考图槽、2000 字指令和默认「自动 / 2K」设置。节点拥有独立画布坐标，可拖动标题和非交互空白区域；图片与节点独立移动，连线实时跟随两端，并参与小地图、适应视图与回到节点判断；删除／撤销保留对应配置。生成、蒙版编辑暂未接后端，不伪造生成结果。

- 融合连线：选中图片或对应节点任意一端时，以主题色显示流动蚂蚁线；两端均未选中时为灰色实线。连续流动使用 800ms linear 循环，选中颜色切换仍为 200ms ease-out；减少动态效果时停用流动。节点表单操作不得误触拖动，节点移动支持撤销／重做。

- 融合生成设置统一使用 `SettingSelect`：Select 母版 `66:194`、菜单 `891:4592`、Option `380:2728`。菜单通过 Portal 和原生 popover 顶层显示，按视窗坐标跟随触发框并避让边缘；不得放入画布变换层或复用通用 `.popover`／Ghost 样式。菜单内边距 8px、选项高 32px、间距 8px，点击外部关闭并失焦；菜单操作不得触发节点拖动。

- 网格吸附默认开启，网格间距与画布点阵共用 `CANVAS_GRID_SIZE=32`（画布坐标）。图片和融合节点拖动以本次抓取节点左上角吸附；多选共用同一位移，保持相对位置。底部「网格吸附」开关保存在本地，Alt／Option 拖动临时绕过；平移和框选不吸附，吸附移动沿用撤销／重做。

- 混合选区（图片与融合节点）或多个融合节点使用全部选中元素的联合边界，沿用多图蓝色虚线外框和蒙版；包含融合节点时不显示图片顶部工具栏。仅选图片时保留原单图／多图工具栏，混合选区支持整组拖动和撤销。

- 整理与适应屏幕的交付契约见 `docs/canvas-layout-and-fit.md`。整理组内水平间距 80、顶部对齐，同行组间及换行间距 120；按当前安全显示区域比较列数，整理后适应全部内容。适应只改视图、倍率 3%～100%；窗口 ResizeObserver 保持视窗中心世界坐标与倍率，不自动重排。`canvasSafeArea` 为布局、适应和节点显露共用入口。

- 图片与编辑节点自身的选中边框始终保持屏幕 2px，使用反向缩放补偿，不随画布倍率变粗或变细。边框位置和尺寸跟随元素，50%、100%、200% 下粗细均为 2px。
- 画布点阵的点半径与间距一起按 zoom 等比缩放（100% 时半径 1px、间距 32px）；不能固定点大小而只缩短间距，避免缩小时变成密集粗点。点阵平移仍跟随画布，吸附网格保持 32 画布单位。

- 选中连接任一端时，高亮蚂蚁线提升到画布世界内图片／节点内容前方；取消两端选择后恢复底层灰色实线。连线保持 `pointer-events: none`，不拦截图片拖动或节点表单操作，且不跨越画布层覆盖固定工具栏／弹层。

- 图片／编辑节点选中描边使用不拦截事件的独立 2px 圆角覆盖层，避免负偏移 outline；节点选中时原 Border/weak 改为透明，防止叠边。示例 `single-select-asset.png` 实际为 735×915 JPEG，原图最后两行自带黑色像素，不应误判为 UI 边框或擅自裁切。

- 中央选择／抓手互斥工具的选中底色必须引用 `State/selected-brand`，图标引用 `Text/on-brand-black`；不可用 `Brand/primary-hover` 代替，浅色模式两者不同。重做图标使用不含透明度的原始母版遮罩，禁用时由 `Text/disabled` 和工具栏实例 0.65 opacity 表达，禁止再叠加 SVG 内置禁用透明度。

- 网格吸附按钮位于右下工具组的小地图右侧，使用 `89:3545` 关闭磁吸和 `89:3798` 开启磁吸原始图标（原请求 `89:3550` 已不可读取）。使用 ToggleButton 状态样式，并保留两态图标。吸附拖动显示穿过抓取元素左上角实际网格坐标的横竖虚线；松手、关闭吸附或 Alt／Option 绕过时按 200ms ease-out 消失，平移与框选不显示。

- 工具布局以最新 `57:25504` 为准：任务入口放左下，左侧中部仅平台素材；底部中央保留选择／抓手／上传／撤销／重做；右下依次为缩放、整理、小地图、网格吸附、教程、快捷键。桌面边距 16px、右下组间距 8px；任务列表按后续任务规则由数据驱动。
- 小地图和网格吸附以 `ToggleButton 89:4047` 为基础，按用户确认统一画布按钮外观：默认透明底 + Text/secondary；未选中 hover 为 State/hover + Text/primary，与相邻 Ghost 一致；selected 为 Alpha/Brand/20% + Text/brand，selected hover 保持不变；disabled 为透明底 + Text/disabled，并沿用母版整体 0.7 opacity。外层保留 Surface/default 容器，两开关独立，均可同时开启；空格／Enter 激活聚焦按钮，不能误触画布抓手。
- 681～1100px 将中央工具栏上移一行，小地图再上移避让；≤680px 右下工具组上移一行、任务计数隐藏，≤380px 任务入口进一步收窄。≤1100px 适应屏幕底部预留 144px（按高度 25% 封顶）。小地图在触发按钮正上方居中展开，弹层与按钮水平中心对齐；现有响应式工具组位置确保弹层留在视窗内。

- 融合参考图入口先打开「添加参考图／从画布中选择」顶层菜单。素材多选与画布直接点选共用 4 张上限；按剩余名额限制，按 URL 去重。画布选择支持确认／取消／Escape，不移动图片或改正常选区；添加／移除支持撤销重做。入口悬停仅用 State/hover，Border/weak 保持不变。参考图缩略图与添加入口统一 1:1，固定四等分列、间距 8px，280px 节点内约 57.5px 正方形；整行保留 64px 布局高度，不改变节点几何。

- 开始 AI 生成使用业务 `GenerateTaskButton`（Button/GenerateTask default `88:32168`、hover `88:32171`），不得套普通 Primary 悬停。默认 Brand/primary，hover 为横向 #71F4D3 → #52DDE0 → #CCB2FF 渐变，文字、星星与费用保持 Text/on-brand-black；渐变层以 200ms ease-out 淡入淡出。

- 点阵使用无限重复 SVG pattern 纹理，与图片层共用同一 `canvasTransform` 矩阵；点大小和间距不再分别用 CSS background 属性更新。镜头缩放／平移不加 transition；必须同时排除 `.canvas-world` 和 `.canvas-grid pattern`，因为 SVG patternTransform 也会参与全局 CSS transform 动画。验证需比较逐帧 computed transform，不能只读 SVG 属性或 baseVal。选区位置同步更新，避免点阵、图片和工具栏追赶式延迟；弹层、状态透明度与节点位置动画仍沿用原规则。

- 网格吸附横竖辅助线颜色以 Figma `89:4021` 内 `89:3989` 为准，使用 `Dodger Blue/400`（`#5FB7FB`，CSS `--dodger-blue-400`），深浅主题一致；不再使用 Border/brand。

- 画布 ToggleButton 选中图标以产品实例 `89:3270` 的实际可见图标绑定 Text/brand 为准：Dark #20D0C4、Light #022F31。不可依据母版隐藏 Label 的 Brand/primary-hover 推断图标颜色。快捷键实例 `89:3580` 为 Ghost，默认 Text/secondary，父容器 Surface/default + Border/weak；画布 IconButton 禁用整体 opacity 0.65，ToggleButton 禁用 0.7。

- 独立浮动图标按钮容器按 Figma 内描边实现：外层不使用占布局空间的 border，用 pointer-events:none 的 ::after 覆盖 1px Border/weak；40px 容器内按钮也必须为 40px，不能缩成 38px 导致浅色 hover 出现浅色外圈。hover 不改变描边 token。

- 智能搜图按最新收起 `103:4747`／展开 `103:4783`：收起320px宽、展开400×871上限、56px Header、分割线、16px 内容边距、12px 间距、两个120px Dropzone入口；说明用Text/tertiary，上方使用64px原始渐变AI放大镜；两个120px入口无描边、默认State/default、悬停State/hover，上传用原始图标，画布选择入口使用32px原始图标 `105:4785`。展开内容在短窗口内部滚动，只有收起按钮切换展开状态。当前仅还原样式，搜图后端与画布选参考流程未接入，保持明确示例反馈。

- 左下任务列表按 `103:4291` 实现：CanvasTaskList 接收 tasks（id/status/createdAt/thumbnailUrl），空数组时触发按钮 disabled 且不可展开；非空即可展开，不能用 running 数量判断。进行中仅统计 running；清空数组自动收起。展开240px宽、32px标题、12px内边距、8px行距、64px行高、48px缩略图，长列表滚动。生成占位使用原始三色资源，-360°→0°、3s linear循环，减少动态效果时静止。当前后端未接，默认空列表，不自动伪造生成中或完成任务。

- 百分比菜单选择固定倍率时，使用共享 Viewport 的 requestAnimationFrame 插值，200ms ease-out（cubic-bezier(0,0,.58,1)）；图片、节点、点阵、选区与小地图读取同一逐帧状态。不能给点阵或图片单独加 CSS transform transition。连续选择从当前倍率继续，滚轮、平移、小地图等直接镜头操作取消未完成插值；减少动态效果时立即到达目标。

- 抠图全屏弹窗以 `35:4925` 内 `35:5131`／`35:5028` 为准：Overlay/scrim + 50px 模糊，顶部工具栏、加选/减选与笔刷大小、512px 图片面板及 2px Border/brand。初始化抠图上传后和单图工具栏均打开当前图片。手动画笔、套索、框选、钢笔多点闭合支持加减选与本地撤销重做；取消/Escape不改画布，抠出生成透明PNG追加到画布并可撤销。AI识别和收藏资源库未接后端，禁止伪造完成状态。钢笔当前为点击锚点、双击闭合的多边形选区。
- 抠图涂抹工具显示与真实笔刷直径一致的圆形光标（size / 1000 × 当前图片显示宽度），尺寸随滑块及图片布局同步；实时跟随指针、不加过渡、不拦截绘制。深色白圈黑外沿，浅色黑圈白外沿；离开图片、切换工具及触控操作不显示。加选使用原始 lasso-add 图标 `I35:5028;35:6032;35:6027;35:6026`，不能使用添加图片图标。
- 抠图结果通过 sourceImageId 保存原图关系；每次抠出记录直接来源（再次抠图形成来源链）。原图与结果均存在时显示连线，复用融合连线的灰色实线／选中流动高亮及层级规则；拖动跟随真实边界，删除任意端隐藏连线，撤销恢复关系。历史无来源字段的图片不凭名称猜测来源。
- 图片与融合节点支持独立删除：仅删图片时保留 nodeOnly 工作流记录与原位置，清空图片URL/名称、参考图、指令并重置生成设置；不再渲染图片或其连线，空节点仍参与导航、框选、拖动和整理。仅删节点时清除fusion，图片保留；混合选中两者则一起删除。空节点禁止生成。删除操作由同一历史快照恢复，撤销须同时恢复内容、选区和连线；计数不包含nodeOnly记录。
- 提示词交互来源见 docs/prompt-tools-source.json：展开编辑按36:8218，960×640输入区、四角直接拉伸、最大1280×720、50px背景模糊；Esc/空白/收起退出，编辑实时同步节点。保存按38:14912，用280px顶层气泡命名（50字），不再直接存字符串。提示词库按42:18476，1280×800、左320列表和搜索、右详情/编辑/应用，支持新增及本地持久化；旧字符串记录兼容迁移。弹层隔离画布指针事件，保持200ms ease-out与退出延迟卸载。
- 空节点以107:5118为准：主图区域改为56px高、State/default底、无边框、16px圆角的居中「添加主图」入口；文本Text/primary，悬停State/hover。使用AssetPicker单选模式，本地多文件拒绝；确认后只为该节点补回一张主图，节点位置与已有配置保留，主图放左侧80px并恢复连线，使用新图片ID避免旧抠图来源误关联。添加支持撤销。空节点生成按钮保持设计默认颜色，点击先要求添加主图，不发起生成。

### Prompt input and IconButton correction (2026-09-15)
- Shared Button detects icon-only content and applies square geometry without text padding. Default S/M/L = 32/40/48 square; explicit 24px prompt actions and 40px floating controls retain their square dimensions. Keep size selectors low-specificity so local size contracts work.
- Prompt library editor uses live 5.1 Beta Input M (133:1355/1357/1359/1361): height32, horizontal padding8, radius8, font12/16; State/default and State/hover fills; hover retains Border/weak; focus uses Control/fill/focus and Brand/primary, no native outline.
- Prompt library TextArea M (325:2446/2449/2452/2455): padding12, radius12, font14/20; Control/fill/default, hover, focus; weak border default/hover and Brand/primary focus. Source file FO7bCfBv6NPle8egsVaDvG. Reuse theme tokens, never hardcode a dark-only focus border.

### Focus interaction (2026-09-15)
- Show control focus outlines only after Tab/Shift+Tab navigation. Capture pointerdown to reset keyboard modality before modal autofocus/restoration; do not blur controls or remove tab stops. Input/TextArea editing feedback remains the Beta component border.
- Zoom disclosure arrow follows aria-expanded, not focus. Focus-triggered tooltips require keyboard navigation. Verified mouse modal open/close has no ring and Tab resumes the ring.

### Nested prompt library (2026-09-15)
- Expanded editor and prompt library have independent open/presence state. Opening the library from the editor keeps the editor mounted, preserving its text, size and position. Close/Escape/apply dismiss only the library; apply updates the editor text. Opening library directly from the node still returns to canvas. Browser-verified all four paths.

### Prompt associated images (2026-09-15)
- Source Figma product 107:5135. Related images are 144px square, 8px gaps, with top-right 24px badges 主图/AI生成; 280px prompt area and independently scrolling gallery. No records means omit gallery entirely.
- Three requested demo prompt/history fixtures live in src/prompt-associations.ts. Merge by stable ID with saved prompts without overwriting user entries. Match exact generation-time prompt content, not mutable title/entry ID; editing prompt content must not retain unrelated historical results.
- Current generation action still has no backend, so associated records are review fixtures only; no claims of live generated history capture. Figma assets stored in public/assets/prompts. Browser verified all demo images load, square/gap geometry, existing entries retained, and no-record/edit hiding.

### Prompt deletion (2026-09-15)
- Existing prompt edit footer has a left-aligned danger-text Delete action; Cancel/Save remain right. Unsaved new drafts only have Cancel/Save. Successful delete selects the next available entry without closing the library.
- Prompt storage now writes {version:2,entries:[...]}; reads migrate prior arrays and add demo fixtures only for legacy/uninitialized data. Version 2 must not reseed removed demos, including after deleting all entries. No canvas image deletion is involved.

### Prompt association ownership correction (2026-09-15)
- Supersedes content-only matching above: generation records require BOTH promptId and exact prompt snapshot to match the selected entry. Save Prompt creates a fresh ID and must never inherit another entry's images, even with identical text. Editing content invalidates the old snapshot match; original entries keep their records.
- Browser-tested applying a demo, changing its final punctuation, saving a new entry, checking new entry has no gallery and original retains 8 images. Also tested identical-text Save As has no inherited gallery and both new entries persist separately.

### New prompt card (2026-09-15)
- Figma 43:19100: New creates a temporary top-of-list card and selects it immediately, clears search and scrolls to top. Empty card uses Untitled / 请输入提示词内容... placeholders, not stored text. Draft edits update card preview. Name/content are required, counters 50/2000, title Input L height40 and textarea radius16.
- Cancel/Delete of unsaved card removes it and restores prior selection. Save persists the same new ID without duplication or associations. Verified browser new/selected/validation/cancel/live preview/save paths.


### 连接分层整理与演示生成（本轮用户确认，覆盖旧横排规则）
- 以 docs/canvas-layout-and-fit.md 为准：图片和编辑器是独立顶点，同源编辑器同列上下排，结果及后续步骤按实际边逐层向右。每层宽度取最大节点宽，列边界间隔80，分支间距120，父节点垂直居中；不再把同源分支按视窗横向分列。不同关联组及独立图区仍按视窗选择外部排列。
- 用户授权本地演示生成：主图与非空指令齐全后，每次生成追加固定360×360示例图，用 generatedByEditorId 关联实际编辑器，支持后续编辑、整理及撤销。无AI请求、真实任务、扣费或提示词生成历史写入；此条覆盖旧的生成仅提示未接后端规则。

### 蚂蚁线与图层展示（2026-09-16，覆盖旧端点遮罩规则）
- 完整契约见 docs/canvas-connections-and-layers.md。高亮线层4；选中内容及选中编辑器的主图／直接生成结果层3；其余关联内容层2；普通灰线层-1。置顶不等于整组连线高亮，不改变保存顺序或选区。
- 主题色虚线2px，暗色底线4px（#111817，双主题同色），端点可见空隙2px，均固定屏幕尺寸。只偏移端点，禁止整张图片遮罩裁断中段；高亮中段经过图片仍置顶。
- 抠图只连实际来源图片；新结果清除继承的生成编辑器字段，旧记录 sourceImageId 优先，连线、整理及置顶保持一致。
