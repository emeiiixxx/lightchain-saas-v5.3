import { Button, Divider, Icon } from './ui';
import { messages, type Locale } from '../i18n';

export type ResultFeedback = 'like' | 'dislike';
type Props = {
  locale: Locale;
  value?: ResultFeedback;
  onFeedback: (value: ResultFeedback, anchor: HTMLElement) => void;
  onImprove: (anchor: HTMLElement) => void;
  onRegenerate: () => void;
};
export function ResultFeedbackToolbar({ locale, value, onFeedback, onImprove, onRegenerate }: Props) {
  const t = messages[locale];
  return <div className="result-feedback-toolbar" role="group" aria-label={t.resultFeedback} data-node-id="68:27435">
    <Button aria-label={t.resultLike} aria-pressed={value === 'like'} onClick={event => onFeedback('like', event.currentTarget)}><Icon name={value === 'like' ? 'resultLikeFilled' : 'resultLike'} size={20} /></Button>
    <Button aria-label={t.resultDislike} aria-pressed={value === 'dislike'} onClick={event => onFeedback('dislike', event.currentTarget)}><Icon name={value === 'dislike' ? 'resultDislikeFilled' : 'resultDislike'} size={20} /></Button>
    <Divider vertical />
    <Button onClick={event => onImprove(event.currentTarget)}>{t.resultImprove}</Button>
    <Divider vertical />
    <Button onClick={onRegenerate}>{t.resultRegenerate}</Button>
  </div>;
}
