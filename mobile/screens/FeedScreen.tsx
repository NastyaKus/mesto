import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { PostCard } from "../components/PostCard";
import { api, FeedPost } from "../lib/api";
import { colors, radius } from "../lib/theme";

export function FeedScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const { posts } = await api.feed();
      setPosts(posts);
    } catch {
      // тихо игнорируем — повторим на следующем тике/refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 8000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const publish = async () => {
    const value = text.trim();
    if (!value) return;
    setPosting(true);
    setText("");
    try {
      await api.createPost(value);
      await load();
    } catch {
    } finally {
      setPosting(false);
    }
  };

  const react = async (id: string, emoji: string) => {
    // Оптимистично, затем синхронизация.
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? patch(p, emoji) : p)),
    );
    try {
      const { post } = await api.react(id, emoji);
      setPosts((prev) => prev.map((p) => (p.id === id ? post : p)));
    } catch {}
  };

  return (
    <View style={styles.root}>
      <View style={styles.composer}>
        <TextInput
          placeholder="Что у вас нового?"
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={setText}
          multiline
          style={styles.input}
        />
        <Pressable
          onPress={publish}
          disabled={posting || !text.trim()}
          style={[styles.pub, !text.trim() ? { opacity: 0.5 } : null]}
        >
          {posting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.pubText}>Опубликовать</Text>
          )}
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} onReact={react} />}
          contentContainerStyle={{ padding: 14 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brand}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Пока пусто. Напишите первый пост или найдите друзей на веб-версии.
            </Text>
          }
        />
      )}
    </View>
  );
}

// Оптимистичный пересчёт реакции.
function patch(p: FeedPost, emoji: string): FeedPost {
  const map = new Map(p.reactions.map((r) => [r.emoji, r.count]));
  const bump = (e: string, d: number) =>
    map.set(e, Math.max(0, (map.get(e) ?? 0) + d));
  let mine: string | null;
  if (p.myReaction === emoji) {
    bump(emoji, -1);
    mine = null;
  } else if (p.myReaction) {
    bump(p.myReaction, -1);
    bump(emoji, 1);
    mine = emoji;
  } else {
    bump(emoji, 1);
    mine = emoji;
  }
  const reactions = [...map.entries()]
    .filter(([, c]) => c > 0)
    .map(([e, c]) => ({ emoji: e, count: c }));
  return { ...p, reactions, myReaction: mine };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  composer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 100,
  },
  pub: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  pubText: { color: "#fff", fontWeight: "700" },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40, padding: 20 },
});
