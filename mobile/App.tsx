import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./lib/auth";
import { NavProvider, useNav } from "./lib/nav";
import { api } from "./lib/api";
import { colors } from "./lib/theme";
import { Logo } from "./components/Logo";
import { AuthScreen } from "./screens/AuthScreen";
import { FeedScreen } from "./screens/FeedScreen";
import { ChatsScreen } from "./screens/ChatsScreen";
import { ChatScreen } from "./screens/ChatScreen";

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Gate />
    </AuthProvider>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }
  if (!user) return <AuthScreen />;
  return (
    <NavProvider initial={{ name: "tabs" }}>
      <Main />
    </NavProvider>
  );
}

function Main() {
  const { route } = useNav();

  // Heartbeat онлайн-статуса.
  useEffect(() => {
    api.presence().catch(() => {});
    const t = setInterval(() => api.presence().catch(() => {}), 45000);
    return () => clearInterval(t);
  }, []);

  if (route.name === "chat") {
    return (
      <SafeAreaView style={styles.safe}>
        <ChatScreen id={route.params!.id} title={route.params!.title} />
      </SafeAreaView>
    );
  }
  return <Tabs />;
}

function Tabs() {
  const { logout, user } = useAuth();
  const [tab, setTab] = useState<"feed" | "chats">("feed");

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Logo size={28} />
        <Text style={styles.brand}>mesto</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.hi} numberOfLines={1}>
          {user?.displayName}
        </Text>
        <Pressable onPress={logout} style={styles.logout}>
          <Text style={styles.logoutText}>Выйти</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        {tab === "feed" ? <FeedScreen /> : <ChatsScreen />}
      </View>

      <View style={styles.tabbar}>
        <TabButton
          label="Лента"
          icon="📰"
          active={tab === "feed"}
          onPress={() => setTab("feed")}
        />
        <TabButton
          label="Чаты"
          icon="💬"
          active={tab === "chats"}
          onPress={() => setTab("chats")}
        />
      </View>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <Text style={{ fontSize: 20, opacity: active ? 1 : 0.5 }}>{icon}</Text>
      <Text style={[styles.tabLabel, { color: active ? colors.brand2 : colors.muted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  brand: { color: colors.brand2, fontWeight: "800", fontSize: 20 },
  hi: { color: colors.muted, fontSize: 13, maxWidth: 120 },
  logout: {
    backgroundColor: colors.surface2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: { color: colors.text, fontSize: 13 },
  tabbar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 8 },
  tabLabel: { fontSize: 11, marginTop: 2 },
});
