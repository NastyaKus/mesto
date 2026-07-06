import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { api, ChatMessage, Thread } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useNav } from "../lib/nav";
import { colors, radius } from "../lib/theme";

export function ChatScreen({ id, title }: { id: string; title: string }) {
  const { user } = useAuth();
  const { back } = useNav();
  const [thread, setThread] = useState<Thread | null>(null);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const t = await api.thread(id);
      setThread(t);
    } catch {}
  }, [id]);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 2000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setText("");
    try {
      await api.send(id, value);
      await load();
    } catch {}
  };

  const others = (thread?.participants ?? []).filter((p) => p.userId !== user?.id);
  const typing = others.filter((p) => p.typing).map((p) => p.displayName);
  const subtitle =
    typing.length > 0
      ? typing.length === 1
        ? "печатает…"
        : "печатают…"
      : thread?.isGroup
        ? `${thread.participants.length} участников`
        : others[0]?.online
          ? "в сети"
          : "не в сети";

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={back} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.title} numberOfLines={1}>
            {thread?.title ?? title}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={thread?.messages ?? []}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.senderId === user?.id;
          const sender = thread?.participants.find((p) => p.userId === item.senderId);
          if (item.deleted) {
            return (
              <View style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
                <Text style={styles.deleted}>сообщение удалено</Text>
              </View>
            );
          }
          return (
            <View style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                {thread?.isGroup && !mine && sender && (
                  <Text style={styles.sender}>{sender.displayName}</Text>
                )}
                {item.replyTo && (
                  <View style={styles.quote}>
                    <Text style={styles.quoteAuthor}>{item.replyTo.author}</Text>
                    <Text style={styles.quoteText} numberOfLines={1}>
                      {item.replyTo.preview}
                    </Text>
                  </View>
                )}
                <Text style={mine ? styles.textMine : styles.textOther}>
                  {item.content}
                  {item.editedAt ? "  (изм.)" : ""}
                </Text>
                {item.reactions.length > 0 && (
                  <Text style={styles.reactions}>
                    {item.reactions.map((r) => `${r.emoji}${r.count}`).join(" ")}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputBar}>
        <TextInput
          placeholder="Написать сообщение…"
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={(v) => {
            setText(v);
            api.typing(id).catch(() => {});
          }}
          style={styles.input}
          onSubmitEditing={send}
        />
        <Pressable onPress={send} style={styles.sendBtn}>
          <Text style={styles.sendText}>→</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  back: { paddingRight: 10 },
  backText: { color: colors.brand2, fontSize: 30, lineHeight: 30 },
  title: { color: colors.text, fontWeight: "700", fontSize: 16 },
  subtitle: { color: colors.muted, fontSize: 12 },
  bubbleRow: { marginBottom: 6, flexDirection: "row" },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },
  bubble: { maxWidth: "80%", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: colors.brand },
  bubbleOther: { backgroundColor: colors.surface2 },
  sender: { color: colors.brand2, fontWeight: "700", fontSize: 12, marginBottom: 2 },
  textMine: { color: "#fff", fontSize: 15 },
  textOther: { color: colors.text, fontSize: 15 },
  deleted: { color: colors.muted, fontStyle: "italic", fontSize: 14 },
  reactions: { marginTop: 4, fontSize: 12, color: "#fff" },
  quote: {
    borderLeftWidth: 2,
    borderLeftColor: "#ffffff88",
    paddingLeft: 6,
    marginBottom: 4,
  },
  quoteAuthor: { color: "#fff", fontWeight: "700", fontSize: 12 },
  quoteText: { color: "#ffffffcc", fontSize: 12 },
  inputBar: {
    flexDirection: "row",
    padding: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontSize: 20, fontWeight: "700" },
});
