import { useRef, type ReactNode, type Ref } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from "react-native";
import {
  ActionButton,
  AsyncContent,
  ChoiceGroup,
  ProductText,
  ScreenHeader,
  useProductUITheme,
  type ChoiceGroupHandle,
} from "../../components/product-ui";

export type InboxEntry = { id: string; unread: boolean };
export type InboxFilter = "all" | "unread";
export type NotificationInboxProps<T extends InboxEntry> = {
  entries: readonly T[];
  /** Controlled by the host so deferred source replacement cannot reset selection or recovery. */
  filter: InboxFilter;
  onFilterChange(filter: InboxFilter): void;
  ready: boolean;
  errorMessage?: string;
  onRetry?: () => void | Promise<unknown>;
  title?: string;
  beforeHeader?: ReactNode;
  headerAction?: ReactNode;
  feedback?: ReactNode;
  notice?: { message: string; warning?: boolean } | null;
  undo?: {
    label?: string;
    accessibilityLabel?: string;
    busy?: boolean;
    onPress(): void | Promise<unknown>;
  };
  onMarkAllRead(): void | Promise<unknown>;
  markingRead?: boolean;
  emptyContent?: ReactNode;
  renderItem(
    info: ListRenderItemInfo<T> & { previous: T | undefined },
  ): ReactNode;
  listRef?: Ref<FlatList<T>>;
};

/** Complete virtualized inbox composition. Delivery sources, persistence and route content stay host-owned. */
export function NotificationInbox<T extends InboxEntry>({
  entries,
  filter,
  onFilterChange,
  ready,
  errorMessage,
  onRetry,
  title = "Inbox",
  beforeHeader,
  headerAction,
  feedback,
  notice,
  undo,
  onMarkAllRead,
  markingRead,
  emptyContent,
  renderItem,
  listRef,
}: NotificationInboxProps<T>) {
  const theme = useProductUITheme();
  const choices = useRef<ChoiceGroupHandle>(null);
  const unreadCount = entries.filter((entry) => entry.unread).length;
  const visible =
    filter === "unread" ? entries.filter((entry) => entry.unread) : entries;
  const showAll = () => {
    onFilterChange("all");
    if (Platform.OS === "web") choices.current?.focusOption("all");
  };
  return (
    <FlatList<T>
      ref={listRef}
      accessibilityRole="list"
      data={visible}
      keyExtractor={(entry) => entry.id}
      initialNumToRender={8}
      windowSize={7}
      style={styles.list}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: theme.gutter * 2 },
      ]}
      ListHeaderComponent={
        <View style={[styles.header, { gap: theme.gutter }]}>
          {beforeHeader}
          <ScreenHeader
            title={title}
            action={headerAction}
            description={unreadCount > 0 ? `${unreadCount} unread` : undefined}
          />
          {feedback}
          {notice ? (
            <View style={styles.notice}>
              <View style={styles.noticeCopy} accessibilityLiveRegion="polite">
                <ProductText tone={notice.warning ? "danger" : "default"}>
                  {notice.message}
                </ProductText>
              </View>
              {undo ? (
                <ActionButton
                  label={undo.label ?? "Undo"}
                  accessibilityLabel={undo.accessibilityLabel}
                  onPress={undo.onPress}
                  busy={undo.busy}
                  tone="secondary"
                />
              ) : null}
            </View>
          ) : undo ? (
            <ActionButton
              label={undo.label ?? "Undo"}
              accessibilityLabel={undo.accessibilityLabel}
              onPress={undo.onPress}
              busy={undo.busy}
              tone="secondary"
            />
          ) : null}
          {entries.length ? (
            <View style={styles.toolbar}>
              <ChoiceGroup
                ref={choices}
                label="Notification filter"
                value={filter}
                onChange={(value) => onFilterChange(value as InboxFilter)}
                options={[
                  {
                    value: "all",
                    label: "All",
                    accessibilityLabel: "All notifications",
                  },
                  {
                    value: "unread",
                    label: "Unread",
                    accessibilityLabel: `Unread notifications, ${unreadCount}`,
                  },
                ]}
              />
              {unreadCount > 0 ? (
                <ActionButton
                  label="Mark all read"
                  accessibilityLabel="Mark all notifications as read"
                  onPress={onMarkAllRead}
                  busy={markingRead}
                  tone="secondary"
                />
              ) : null}
            </View>
          ) : null}
          {/* Source loading/errors remain visible even when another source supplied rows. */}
          {!ready || errorMessage ? (
            <AsyncContent
              status={errorMessage ? "error" : "loading"}
              onRetry={onRetry}
              errorMessage={errorMessage}
              loadingLabel="Loading notifications"
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        ready && !errorMessage ? (
          entries.length > 0 ? (
            <View style={styles.empty}>
              <ProductText variant="heading" headingLevel={2}>
                No unread notifications
              </ProductText>
              <ProductText tone="muted">
                Your earlier notifications are still in All.
              </ProductText>
              <ActionButton
                label="Show all notifications"
                onPress={showAll}
                tone="secondary"
              />
            </View>
          ) : (
            <>
              {emptyContent ?? (
                <AsyncContent
                  status="empty"
                  emptyTitle="You’re all caught up"
                  emptyMessage="New notifications will appear here."
                />
              )}
            </>
          )
        ) : undefined
      }
      renderItem={(info) => (
        <>{renderItem({ ...info, previous: visible[info.index - 1] })}</>
      )}
    />
  );
}
const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { flexGrow: 1 },
  header: { paddingBottom: 16 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  noticeCopy: { flex: 1, minWidth: 180 },
  empty: { alignItems: "center", padding: 24, gap: 16 },
});
