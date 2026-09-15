import { useEffect, useId, useState } from 'react';
import { Icon } from './ui';
import { usePresence } from '../usePresence';
import { messages, type Locale } from '../i18n';

export type CanvasTask = { id: string; status: 'running' | 'completed' | 'failed'; createdAt: string; thumbnailUrl?: string };
const copy = {
  'zh-CN': { running: '生成中...', completed: '生成完成', failed: '生成失败', count: '进行中' },
  en: { running: 'Generating...', completed: 'Completed', failed: 'Failed', count: 'running' },
  ja: { running: '生成中...', completed: '生成完了', failed: '生成失敗', count: '件実行中' },
};
const emptyTasks: CanvasTask[] = [];

export function CanvasTaskList({ tasks = emptyTasks, locale }: { tasks?: CanvasTask[]; locale: Locale }) {
  const [expanded, setExpanded] = useState(false);
  const hasTasks = tasks.length > 0;
  const open = expanded && hasTasks;
  const shown = usePresence(open ? tasks : null);
  const id = useId();
  const t = copy[locale];
  useEffect(() => { if (!hasTasks) setExpanded(false); }, [hasTasks]);
  const running = tasks.filter(task => task.status === 'running').length;
  return <div className={`canvas-task-widget ${shown.value ? 'is-expanded' : ''}`} data-node-id="103:4291">
    <button type="button" className="canvas-task-trigger" aria-label={messages[locale].taskList} aria-expanded={open} aria-controls={id} disabled={!hasTasks} onClick={() => setExpanded(value => !value)}>
      <Icon name="taskIcon" size={20} /><span className="canvas-task-label">{messages[locale].tasks}</span>
      <span className="canvas-task-count">{running} {t.count}</span><Icon name="imgChevron" size={16} className="canvas-task-chevron" />
    </button>
    {shown.value && <div id={id} className="canvas-task-content" role="list" aria-label={messages[locale].taskList} data-phase={shown.phase} inert={shown.phase === 'exit'}>
      {shown.value.map(task => <div className="canvas-task-row" role="listitem" key={task.id}>
        <div className="canvas-task-thumbnail">
          {task.status === 'running' ? <div className="canvas-task-generating" aria-hidden="true"><div className="canvas-task-gradient">
            <div className="task-gradient-green"><img src="/assets/canvas/generatingGreen.svg" alt="" /></div>
            <div className="task-gradient-blue"><img src="/assets/canvas/generatingBlue.svg" alt="" /></div>
            <div className="task-gradient-purple"><img src="/assets/canvas/generatingPurple.svg" alt="" /></div>
          </div></div> : task.thumbnailUrl ? <img src={task.thumbnailUrl} alt="" /> : null}
        </div>
        <div className="canvas-task-details"><span>{t[task.status]}</span><time dateTime={task.createdAt}>{new Date(task.createdAt).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</time></div>
      </div>)}
    </div>}
  </div>;
}
