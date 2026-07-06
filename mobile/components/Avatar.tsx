import React from "react";
import { View, Image, Text } from "react-native";
import { colors } from "../lib/theme";
import { mediaUrl } from "../lib/api";

export function Avatar({
  src,
  name,
  size = 44,
  online,
}: {
  src?: string | null;
  name: string;
  size?: number;
  online?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const uri = mediaUrl(src);
  const dot = Math.max(9, Math.round(size * 0.28));

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.brand,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: size * 0.4 }}>
            {initials}
          </Text>
        </View>
      )}
      {online !== undefined && online && (
        <View
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: dot,
            height: dot,
            borderRadius: dot,
            backgroundColor: colors.online,
            borderWidth: 2,
            borderColor: colors.bg,
          }}
        />
      )}
    </View>
  );
}
