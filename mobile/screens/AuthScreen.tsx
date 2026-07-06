import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Logo } from "../components/Logo";
import { useAuth } from "../lib/auth";
import { colors, radius } from "../lib/theme";

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email.trim(), password);
      else
        await register({
          email: email.trim(),
          username: username.trim(),
          displayName: displayName.trim(),
          password,
        });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <View style={styles.hero}>
        <Logo size={72} />
        <Text style={styles.brand}>mesto</Text>
        <Text style={styles.tagline}>место, где вы на связи</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{mode === "login" ? "Вход" : "Регистрация"}</Text>

        {mode === "register" && (
          <>
            <TextInput
              placeholder="Имя"
              placeholderTextColor={colors.muted}
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.input}
            />
            <TextInput
              placeholder="Логин (латиница)"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
            />
          </>
        )}
        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Пароль"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable onPress={submit} disabled={busy} style={styles.button}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === "login" ? "Войти" : "Создать аккаунт"}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setError(null);
            setMode(mode === "login" ? "register" : "login");
          }}
        >
          <Text style={styles.switch}>
            {mode === "login"
              ? "Нет аккаунта? Зарегистрироваться"
              : "Уже есть аккаунт? Войти"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    padding: 20,
  },
  hero: { alignItems: "center", marginBottom: 24 },
  brand: {
    color: colors.brand2,
    fontSize: 40,
    fontWeight: "800",
    marginTop: 10,
  },
  tagline: { color: colors.muted, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 14 },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  error: { color: colors.like, marginBottom: 10 },
  button: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  switch: { color: colors.brand2, textAlign: "center", marginTop: 14 },
});
