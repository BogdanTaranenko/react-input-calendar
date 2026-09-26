import { DatePicker } from '@b.taranenko/react-input-calendar';
import styles from './picker.module.css';

export default function CssModules() {
  return (
    <DatePicker
      label="Styled with a CSS Module"
      classNames={{
        trigger: styles.trigger,
        popover: styles.popover,
        day: styles.cell,
        dayButton: styles.button,
      }}
    />
  );
}
