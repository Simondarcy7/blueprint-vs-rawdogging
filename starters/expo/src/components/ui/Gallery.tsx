import { useState } from 'react';
import { Screen } from './Screen';
import { Card } from './Card';
import { Text } from './Text';
import { Button } from './Button';
import { Field } from './Field';
import { Notice, LoadingState } from './States';
import { ConfirmDialog } from './ConfirmDialog';
import { showGallery } from '@/config/env';
export function Gallery() {
  const [dialog, setDialog] = useState(false);
  if (!showGallery)
    return (
      <Screen title="Preview unavailable">
        <Text>The component preview is enabled only for development review.</Text>
      </Screen>
    );
  return (
    <Screen
      title="Component preview"
      description="Development fixtures for shared controls. These examples do not save data."
    >
      <Card>
        <Text variant="heading">Buttons and feedback</Text>
        <Button label="Primary action" onPress={() => setDialog(true)} />
        <Button label="Secondary action" variant="secondary" />
        <Button label="Unavailable action" disabled />
        <Button label="Saving" busy />
        <Button label="Destructive action" variant="danger" />
      </Card>
      <Card>
        <Field
          label="Example field"
          placeholder="Enter some text"
          hint="A persistent, useful hint."
        />
        <Field label="Field with an error" value="" error="Tell the user what to correct." />
      </Card>
      <LoadingState label="Loading example…" />
      <Notice title="Nothing here yet" message="Explain the first useful action." />
      <Notice
        error
        title="Connection unavailable"
        message="Keep existing content and offer a meaningful retry."
        action="Try again"
        onAction={() => {}}
      />
      <ConfirmDialog
        visible={dialog}
        title="Confirm an action?"
        message="Explain the consequence in plain language."
        confirmLabel="Confirm example"
        onCancel={() => setDialog(false)}
        onConfirm={() => setDialog(false)}
      />
    </Screen>
  );
}
