import { useId } from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import { tokens } from '@/theme/tokens';
import type { ChoiceGroupProps } from './ChoiceGroup';
// Real web radio inputs provide arrow-key selection, focus and checked semantics.
export function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: ChoiceGroupProps<T>) {
  const id = useId();
  const { colors } = useTheme();
  return (
    <fieldset
      aria-label={label}
      style={{ border: 0, margin: 0, padding: 0, display: 'grid', gap: 12 }}
    >
      {options.map((option) => (
        <label
          key={option.value}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minHeight: 48,
            padding: '12px 24px',
            boxSizing: 'border-box',
            cursor: disabled ? 'default' : 'pointer',
            borderRadius: tokens.radius.pill,
            border: `1px solid ${colors.controlBorder}`,
            background: value === option.value ? colors.accent : colors.surface,
            color: value === option.value ? colors.onAccent : colors.text,
            fontSize: 16,
            fontFamily: tokens.fonts.body ?? 'system-ui',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <input
            type="radio"
            name={id}
            value={option.value}
            checked={value === option.value}
            disabled={disabled}
            onChange={() => onChange(option.value)}
            style={{ width: 18, height: 18, margin: 0, accentColor: colors.text, flexShrink: 0 }}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
