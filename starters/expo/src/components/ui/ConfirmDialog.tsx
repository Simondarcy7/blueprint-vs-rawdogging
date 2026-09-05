import { Modal, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  busy = false,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal
      accessibilityLabel={title}
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {
        if (!busy) onCancel();
      }}
    >
      <View
        style={{ flex: 1, backgroundColor: '#00000080', justifyContent: 'center', padding: 24 }}
      >
        <Card
          accessibilityViewIsModal
          accessibilityLabel={title}
          style={{
            width: '100%',
            maxWidth: 460,
            alignSelf: 'center',
            backgroundColor: colors.surface,
          }}
        >
          <Text variant="heading" accessibilityRole="header">
            {title}
          </Text>
          <Text>{message}</Text>
          <Button label="Keep editing" onPress={onCancel} disabled={busy} variant="secondary" />
          <Button label={confirmLabel} onPress={onConfirm} busy={busy} variant="danger" />
        </Card>
      </View>
    </Modal>
  );
}
