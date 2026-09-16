# 项目交互规则

- 产品版本统一为 SaaS v5.3，包版本为 5.3.0；仓库名及 GitHub Pages 路径统一为 `lightchain-saas-v5.3`。Lightchain SaaS v5.1 libraries Beta 是组件库依赖版本，保持原标识。

- UI 组件与图标以 Lightchain SaaS v5.1 libraries Beta 为准；不得引入旧版组件或用文字字符代替已有图标。
- 普通交互动效统一为 `200ms ease-out`，集中维护在 `src/motion.css`。新交互必须沿用此规则，菜单、弹层与提示的退出需保留完整动画后再卸载。
- 直接拖拽实时跟随指针；系统 `prefers-reduced-motion` 优先。画布镜头平移、缩放与适应视图立即同步，状态切换沿用统一曲线。
- 菜单选项之间间隔 8px；选中勾使用组件库 `Icon/System / Style=Linear, Name=check` 原始资源。
- 同时兼容深浅主题，颜色沿用语义 token；局部修正不改动无关布局。
- 右下角整理／教程／快捷键按钮共用「容器＋Ghost」结构：容器使用 Surface/default、Border/weak 与阴影；按钮默认透明，悬停在容器上叠加 State/hover，图标默认 Text/secondary、悬停 Text/primary。不得把容器底色直接放到按钮上再用半透明 hover 替换。小地图和网格吸附使用独立 ToggleButton，不能套此 Ghost 或互斥工具选中态。
- 初始化功能入口使用 Figma `50:24161` 单选素材弹窗。图片悬停显示暗色蒙版，底部滑入 5.1 Beta Primitive「使用」按钮；不显示勾选框或底部确认栏。点击「使用」直接替换画布主图并关闭弹窗；主图最多 1 张，多张拖入须提示并拒绝，关闭弹窗不修改画布。

- 初始化五个功能按钮下方的上传区（`62:27018`，桌面 624×360）及画布工具栏上传入口打开 Figma `17:1333` 多选弹窗。单次最多 20 张，展示 `0 / 20`、组件库勾选框及取消/确认按钮；本地批量上传自动加入本次选择，超出剩余额度拒绝该批次，确认追加普通素材到画布并支持整批撤销，不替换已有主图。五个功能入口仍用 `50:24161` 单选流程。

- 上传后画布样式以 Figma 单图 `57:25504`、多图 `57:24422` 为准。批量上传自动选中本批图片；选中 1 张显示单图工具栏，超过 1 张显示蓝色虚线组框、20% 蓝色蒙版与多图工具栏。图片自身使用 2px Border/brand、16px 圆角，工具栏位于选区上方 16px 并跟随视图。选择工具支持空白框选、Shift 多选和整组拖动；抓手/空格平移。撤销与重做恢复图片及选区。

- 初始化最新文案为「从下方选择一个功能或添加图片，开启您的创作」。五个功能按钮后接独立的大上传区；点击打开多选窗口，拖入直接添加并自动选中本批图片。上传格式为 JPG/JPEG/PNG/WebP，单张最多 20 MB。
- 初始化「内衣试衣」入口来源 `136:16942`，位于定向融合和转3D平铺之间，使用 Beta 原始 lingerie-try-on 图标与 Outline L 按钮（144×48）。桌面功能组 784px、间距16，上传区仍为624×360；窄屏换行。点击沿用单图素材选择，以选中图片作为服装图并在右侧创建内衣试衣节点；试衣生成尚未接入。来源记录见 docs/lingerie-entry-source.json。
- 单图工具栏按 `136:17032` 增加「内衣试衣」，位于定向融合和转3D平铺之间，复用同一 Beta 原始图标（16px）、32px 高按钮、12/20 字体及4px图文间距。仅单图显示；点击用当前图片创建内衣试衣节点，不重复上传或复制图片。

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

### 内衣试衣节点（2026-09-16）
- 有服装图按 `136:17371`，空节点按 `136:17414`；复用 5.1 Beta WorkflowNode、PromptTools、SettingSelect 和 GenerateTaskButton，280px 宽、12px 内边距／间距、16px 圆角。提示为「内衣专用AI试衣工具」，服装行56px高、缩略图40px；不显示融合的「添加示意」按钮。
- 「模特图」只保留一个64×64槽，不显示参考图计数；支持单选素材窗口或画布选图，最多1张，移除后可重新添加。沿用撤销、主题 token 与200ms动效。
- 试衣描述最多2000字，保留展开、保存、提示词库和清空，生成设置默认自动／2K。按最新用户授权，画布内衣试衣节点有服装图即可生成本地示例，描述与模特图可留空；一键融合原有必填与本地示例生成不变。
- 工作流类型保存在 fusion.kind，缺省仍为一键融合。删除服装图后保留原位空试衣节点；复制／粘贴保留试衣类型和配置，以空服装图状态出现。沿用现有独立节点拖动、连线、层级、整理、小地图与撤销重做。来源见 docs/lingerie-entry-source.json。本轮遵用户要求未运行检查或浏览器验证。

### AI 试衣独立页（2026-09-16）
- 服装类型菜单仅4项，依次「上装／下装／连身装／不处理」；「请选择」只作触发框未选占位，不进入菜单。「不处理」为有效选择，可通过必选校验。
- 服装图区随图片数量横向等分，始终单行排列；未满4张时上传入口占同一行一列，满4张后隐藏上传入口，4张图片及各自下方类型选择一行展示，间距8px，不排成2×2。
- 顶部「AI 试衣」跳转 `#/ai-try-on`，页面「返回画布」跳转 `#/canvas`；支持直接链接和浏览器前进／后退。共用现有顶部导航、深浅主题、语言和原始图标，画布保持挂载，返回时保留图片、节点、视图与撤销历史；试衣页不触发隐藏画布的键盘快捷键／剪贴板操作。
- 页面按 `136:12198`：432px左侧表单、右侧空生成记录；服装图最多4张，初始常规模式保留Figma原图，支持素材选择、本地上传、拖入与移除。比例／速度用共享SettingSelect，生成用40px GenerateTaskButton；空状态使用8:597原图。
- 模式切换按常规 `136:16116`／内衣 `136:16144`，104×32、4px内边距和间距，选中项60×24显示图标＋文字，未选中项32×24仅图标；父级移动Indicator，6px圆角、State/selected-tab-sliding（Dark白15%，Light白色），外层Surface/secondary、8px圆角。沿用200ms ease-out及减少动态效果，支持方向键／Home／End。
- 常规／内衣分别保留当前会话草稿；描述、参考图、模特套图可切换。描述2000字，支持展开、清空、复制；参考图1张、套图最多4张。自动平铺、任务类型、服装类型、比例与速度仅配置本地状态，AI反推和生成仍明确提示未接服务，不写入伪造记录或扣费。
- ≤720px表单与记录上下排列，短桌面窗口表单内部滚动。来源与边界见 `docs/ai-try-on-source.json`。用户要求未运行浏览器检查或测试。

### 内衣模式新增气泡（2026-09-16）
- 采用页面内最新 `136:17833`（源 `136:17784`）：文案「🎉 新增内衣试衣模式，点击试试看吧！」，右侧20px关闭按钮／16px原始关闭图标，左侧原始箭头。Primitive Colors/Brand/300 底、Text/on-brand-black、Radius/L、Shadow/L、14/20 Medium，内边距12×16、间距8。
- 锚定模式切换右侧1px并垂直居中；窄屏向下避让，随滚动／缩放窗口更新位置。AI试衣页常规／内衣模式均持续显示，只有点击关闭按钮才收起；点击文案只切到内衣，切换模式、Escape或点击外部都不关闭。显式关闭以 lc-tryon-lingerie-announcement-closed 持久化，旧 dismissed 标记不继承（可能来自自动关闭）。200ms退出后卸载，支持减少动态效果；未运行浏览器检查或测试。

### 图片右键菜单（2026-09-16）
- 图片菜单依次「下载／分割线／复制／复制并粘贴／删除」，220px宽、32px条目、8px间距；使用语义主题 token、200ms退出和顶层 Portal 边缘避让。空白画布仍为上传／粘贴。
- 图标使用 Beta Icon/System 原始 SVG：download 120:70、copy 120:50、trash 120:72；复制及复制并粘贴共用库内 copy，不自行重绘。资源来源见 docs/image-context-menu-source.json。
- 右键未选图片切换选区，右键已选图片保留多图选区并排除编辑器。复制并粘贴支持 Ctrl/⌘+D，副本偏移32屏幕像素并选中，支持撤销，不继承原图连线。删除沿用独立图片删除契约。
- 菜单复制保存会话内快照，并写入带会话标记的系统剪贴板供 Ctrl/⌘+V 识别；写入受限时提示右键画布粘贴，外部无匹配标记内容不触发旧图片粘贴。复制并粘贴不覆盖已有剪贴板。未运行浏览器检查或测试。

### 定向融合节点（2026-09-16）
- 按136:17846无融合点／136:17987有融合点实现，fusion.kind为directed。沿用Beta WorkflowNode、GenerateTaskButton、Tooltip、原始图标与主题token；宽280、内边距和间距12、主图行56、主图缩略图40。无提示词输入或比例／分辨率配置。
- 每个节点最多3处融合点，添加／替换调用现有单选AssetPicker；卡片129高、内边距8、双图56×56、间距8，主图与实际所选参考图回显，删除后按当前顺序编号。满3处隐藏添加按钮；添加／替换／删除支持撤销重做。复制节点保留融合点配置，删除主图清空配置；空节点可重新添加主图。
- 高度由workflowHeight统一供连线、选区、小地图、整理与适应使用：0／1／2／3处为269／410／551／624。空白画布定向融合入口和单图工具栏均可进入；后者创建独立编辑器、不重复图片。
- 用户授权融合点缩略图显示示例涂抹蒙版：主图Brand/primary青色、参考图Status/danger红色、70%不透明度，不同融合点位置错开；只在图片加载后叠加，不修改原图、不影响节点几何。覆盖之前不添加示例蒙版的限制。调整蒙版和真实生成尚未接入，点击明确提示；示例蒙版不作为实际编辑数据。设计与资源记录见docs/directed-fusion-source.json。按用户要求未运行检查、构建或浏览器验证。

### 定向融合／内衣试衣示例生成（覆盖旧生成仅提示规则）
- 用户授权画布的定向融合、内衣试衣节点点击生成即出本地示例；仅要求主图／服装图存在，空节点先添加主图。演示不要求融合点、试衣描述或模特图。
- 共用generateDemo，每次追加360×360的本地result.png，名称区分「定向融合结果 · 演示」「内衣试衣结果 · 演示」，generatedByEditorId指向实际节点，放右侧80并避让已有内容，自动选中，支持连线、后续编辑、整理与撤销重做。不调用AI、不扣费、不写真实生成任务或提示词历史；AI试衣独立页流程不变。

### 定向融合空节点（136:18424）
- 删除主图后，定向融合节点保留位置，融合点清空、输入连线移除，回到280×269空状态。保留标题、渐变提示、56px「添加主图」入口、分割线、56px「添加融合点」入口及32px生成按钮，沿用Beta原始add-image／add图标及语义token。
- 点击添加主图打开现有单选素材弹窗；空状态点击添加融合点或生成也先要求添加主图。补图恢复连线且不移动节点；撤销删除恢复原图、融合点及连线。未运行浏览器或测试检查。

### 初始化功能示例（覆盖三项初始化入口原单选流程）
- 空画布点击「一键融合／定向融合／内衣试衣」直接载入对应本地示例，不再先打开上传弹窗。每组由主图、独立对应编辑节点、示例结果组成；以editorSourceId和generatedByEditorId建立真实可操作连线，按现有层级规则整理并适应视图，初始不选中元素。
- 一键融合预填参考图和指令；定向融合预填1个融合点及示例蒙版；内衣试衣预填1张模特图和试衣描述。资产与文案集中在src/workflow-examples.ts，采用已有本地演示素材，不代表真实生成记录。
- 整组载入只记一次撤销；节点与结果继续支持修改、生成、拖拽、删除及整理。异步加载期间禁用初始化按钮，取消或切页不得覆盖后续操作，失败回到空画布并提示重试。
- 抠图、转3D平铺保留现有初始化流程；单图工具栏、节点补主图和画布上传流程不变。按用户要求未运行浏览器、构建或测试检查。

### 配套示例素材（覆盖旧无关占位图与360×360统一结果）
- src/workflow-examples.ts使用public/assets/workflow-examples下配套素材：一键融合主图为用户提供的乳白色蕾丝家居服套装，使用用户完整复古卧室时尚社论提示词，不预置参考图，结果使用用户提供的复古卧室模特上身图GbBGKRCM.png；定向融合保持人物／棚拍背景，替换为参考图蓝色花裙；内衣试衣使用用户提供的黄紫拼色内衣套装原图和同款金发模特上身原图，模特参考使用screenshot-20260916-181809.png，演示结果使用screenshot-20260916-180851.png；提示词匹配拼色、黑色包边、蕾丝和暖桃色布景。
- 点击节点生成复用当前功能对应结果图，画布宽360、保持各自原图比例（一键融合结果1792:2400，内衣结果794:1064，定向融合结果2:3），仍属固定本地演示，不根据修改后输入实时生成。初始化和继续生成共用结果配置，完整生成提示词见docs/workflow-example-images.json。未打开浏览器或运行构建／测试。

### 内衣试衣入口 NEW 标签
- 空画布「内衣试衣」按钮右上角使用 Figma `136:18786` 的 Badge/Text/Pill：20px高、左右8px、12/16 Medium、最大圆角，顶偏移-8px、右偏移-4px。底色为 Brand/gradient-chat（Gradient/cyan-300 → Gradient/perfume-300），文字 Text/on-brand-black，深浅主题共用；绝对定位，不改变按钮和工具行尺寸，不拦截点击。

### 转3D平铺节点与初始化示例
- 使用 Figma 有主图 `136:18488`、空节点 `136:18657`，280×417，复用 Beta 节点、提示、SettingSelect、GenerateTaskButton 与原始图标。来源记录见 `docs/flat-lay-node-source.json`。
- 选择区域仅上装／下装／连身装；生成面正面／背面单选，普通节点默认上装／正面，示例默认连身装／正面；设置自动／2K。ChoiceChip 依目标实例使用 Alpha/Brand/20% + Border/brand，选中悬停保持。
- 空画布入口直接创建用户提供的模特主图、转3D平铺节点和对应平铺结果；单图工具栏直接用当前主图创建节点。图片保存在 public/assets/workflow-examples/flat-main.jpg、flat-result.png，保持原图字节和比例。
- 生成复用固定示例结果，宽360、1792:2400，不调用AI或扣费。删主图保留空节点；补主图沿用单选弹窗并保留编辑器ID及结果连接。菜单与生成面设置可撤销，节点复用共享拖动、连线、整理及导航。此条覆盖旧转3D平铺仅选素材的初始化规则。

### 定向融合生成条件
- 没有融合点时，开始 AI 生成按钮使用现有 GenerateTaskButton 禁用态；添加至少一个融合点后恢复，删除最后一个融合点立即禁用。生成入口同时校验，零融合点不追加结果。此条覆盖旧演示生成无需融合点的规则。

### 画布删除快捷键焦点修正
- 画布支持程序化聚焦（tabIndex=-1）。开始画布选择／拖拽／框选时，因 preventDefault 阻止原生焦点转移，需显式 focus({preventScroll:true}) 将键盘焦点移回画布；生成并选中新结果后同样处理，避免焦点仍在节点生成按钮而被 .fusion-node 快捷键保护拦截。
- Delete／Backspace 沿用当前选区删除与撤销；输入框和节点表单实际编辑时继续保留快捷键保护。此次按用户要求未运行浏览器或测试。

### 初始化产品说明与验收文档同步
- P0「5. 画布初始化样式优化」最新统一契约见 docs/canvas-initialization.md，包含五入口、四种直接载入示例、各功能生成条件、空节点、上传边界和图片删除焦点。飞书产品文档、本地产品文档及专项来源记录同步维护。原“四个功能均先选主图”仅属历史，不再用于当前验收。验收表为待执行标准，旧截图只作历史参考，不声称本轮已运行浏览器验收。
