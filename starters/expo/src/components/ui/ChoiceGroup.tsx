import { View } from 'react-native';
import { Button } from './Button';
export interface ChoiceGroupProps<T extends string> {
  label: string;
  value: T;
  options: readonly { label: string; value: T }[];
  disabled?: boolean;
  onChange: (value: T) => void;
}
export function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: ChoiceGroupProps<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: 12 }}>
      {options.map((option) => (
        <Button
          key={option.value}
          label={option.label}
          variant={value === option.value ? 'primary' : 'secondary'}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === option.value }}
          disabled={disabled}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}
