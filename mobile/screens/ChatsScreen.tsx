import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Avatar } from "../components/Avatar";
import { api, ConversationSummary } from "../lib/api";
import { useNav } from "../lib/nav";
import { colors, radius } from "../lib/theme";
import { timeAgo } from "../lib/format";

export function ChatsScreen() {
  const { navigate } = useNav();
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const { conversations } = await api.conversations();
      setItems(conversations);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 4000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);

  if (loading) {
    return <ActivityIndicator color={colors.brand} style={{ marginTop: 30 }} />;
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={items}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigate("chat", { id: item.id, title: item.title })}
          style={styles.row}
        >
          <Avatar
            src={item.avatarUrl}
            name={item.title}
            size={50}
            online={item.isGroup ? undefined : item.online}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.top}>
              <Text style={styles.title} numberOfLines={1}>
                {item.pinned ? "📌 " : ""}
                {item.isGroup ? "👥 " : ""}
                {item.title}
              </Text>
              {item.lastMessage && (
                <Text style={styles.time}>
                  {timeAgo(item.lastMessage.createdAt)}
                </Text>
              )}
            </View>
            <View style={styles.top}>
              <Text style={styles.preview} numberOfLines={1}>
                {item.lastMessage?.content || "Нет сообщений"}
              </Text>
              {item.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unread}</Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>
          Пока нет диалогов. Начните переписку в веб-версии.
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: colors.text, fontWeight: "700", fontSize: 15, flex: 1 },
  time: { color: colors.muted, fontSize: 12, marginLeft: 8 },
  preview: { color: colors.muted, fontSize: 14, flex: 1, marginTop: 2 },
  badge: {
    backgroundColor: colors.brand,
    borderRadius: 999,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 8,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700", textAlign: "center" },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40, padding: 20 },
});
