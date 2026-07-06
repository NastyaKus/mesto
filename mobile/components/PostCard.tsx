import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Avatar } from "./Avatar";
import { colors, radius } from "../lib/theme";
import { timeAgo } from "../lib/format";
import { mediaUrl, FeedPost } from "../lib/api";

export function PostCard({
  post,
  onReact,
}: {
  post: FeedPost;
  onReact: (id: string, emoji: string) => void;
}) {
  const author = post.group
    ? { name: post.group.name, avatar: post.group.avatarUrl }
    : { name: post.author.displayName, avatar: post.author.avatarUrl };
  const total = post.reactions.reduce((s, r) => s + r.count, 0);
  const img = mediaUrl(post.imageUrl);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Avatar src={author.avatar} name={author.name} size={42} />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.name}>{author.name}</Text>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>
      </View>

      {!!post.content && <Text style={styles.body}>{post.content}</Text>}
      {img && <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />}

      <View style={styles.actions}>
        <Pressable
          onPress={() => onReact(post.id, "❤️")}
          style={[styles.reactBtn, post.myReaction ? styles.reactBtnOn : null]}
        >
          <Text style={styles.reactText}>
            {post.myReaction ?? "🤍"} {total > 0 ? total : ""}
          </Text>
        </Pressable>
        {post.reactions.length > 0 && (
          <Text style={styles.reactSummary}>
            {post.reactions.slice(0, 3).map((r) => r.emoji).join(" ")}
          </Text>
        )}
        {post.comments.length > 0 && (
          <Text style={styles.comments}>💬 {post.comments.length}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  head: { flexDirection: "row", alignItems: "center" },
  name: { color: colors.text, fontWeight: "700", fontSize: 15 },
  time: { color: colors.muted, fontSize: 12, marginTop: 1 },
  body: { color: colors.text, fontSize: 15, lineHeight: 21, marginTop: 10 },
  image: {
    width: "100%",
    height: 220,
    borderRadius: radius.md,
    marginTop: 10,
    backgroundColor: colors.surface2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  reactBtn: {
    backgroundColor: colors.surface2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reactBtnOn: { backgroundColor: "#2a1f52" },
  reactText: { color: colors.text, fontSize: 14 },
  reactSummary: { color: colors.muted, fontSize: 14 },
  comments: { color: colors.muted, fontSize: 14, marginLeft: "auto" },
});
