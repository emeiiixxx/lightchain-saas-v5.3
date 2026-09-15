import { Button, Divider, Icon, type IconName } from './ui';
import { messages, type Locale } from '../i18n';

type Action = keyof typeof messages['zh-CN'];
type Props = { locale: Locale; multiple: boolean; onAction: (action: Action) => void; onDownload: () => void };
export function SelectionToolbar({ locale, multiple, onAction, onDownload }: Props) {
  const t = messages[locale];
  const action = (label: Action, icon: IconName, size = 16) => <Button key={label} onClick={() => onAction(label)}><Icon name={icon} size={size} />{t[label]}</Button>;
  const iconAction = (label: Action, icon: IconName, handler = () => onAction(label)) => <Button key={label} className="canvas-icon-button" aria-label={t[label]} title={t[label]} onClick={handler}><Icon name={icon} size={20} /></Button>;
  return <div className="media-toolbar" role="toolbar" aria-label={t.selectionTools} data-node-id={multiple ? '57:25319' : '68:28134'}>
    {multiple ? <>
      {action('mergeImages', 'mergeImages', 20)}{action('batchEdit', 'batchEdit', 20)}{action('multiFlat', 'multiFlat', 20)}
      <Divider vertical />{action('removeBackground', 'removeBackground')}<Divider vertical />
    </> : <>
      {action('cutout', 'toolbarCutout')}<Divider vertical />
      {action('fusion', 'toolbarFusion')}{action('directed', 'toolbarDirected')}{action('flat', 'singleFlat')}{action('editImage', 'editImage')}<Divider vertical />
      {iconAction('imageSearch', 'imageSearch')}{iconAction('saveAsset', 'saveAsset')}
    </>}
    {iconAction('download', 'downloadIcon', onDownload)}
    {!multiple && iconAction('sendImage', 'sendIcon')}
  </div>;
}
