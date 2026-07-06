// Клиент мобильного API mesto. База берётся из EXPO_PUBLIC_API_URL,
// по умолчанию — боевой бэкенд на Vercel.
const BASE =
  (process.env.EXPO_PUBLIC_API_URL || "https://mesto-vert.vercel.app") + "/api/v1";

const ORIGIN =
  process.env.EXPO_PUBLIC_API_URL || "https://mesto-vert.vercel.app";

// Относительные пути картинок (/uploads/…) → абсолютный URL.
export function mediaUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  return u.startsWith("/") ? ORIGIN + u : u;
}

let token: string | null = null;
export function setApiToken(t: string | null) {
  token = t;
}

async function req<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { ...opts, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
  return data;
}

export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastSeenAt?: string | null;
};

export type FeedPost = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  isMine: boolean;
  reactions: { emoji: string; count: number }[];
  myReaction: string | null;
  author: { username: string; displayName: string; avatarUrl: string | null };
  group: { slug: string; name: string; avatarUrl: string | null } | null;
  comments: { id: string }[];
};

export type ConversationSummary = {
  id: string;
  isGroup: boolean;
  title: string;
  avatarUrl: string | null;
  other: { username: string; displayName: string; avatarUrl: string | null } | null;
  online: boolean;
  lastMessage: { senderId: string; content: string; createdAt: string } | null;
  unread: number;
  pinned: boolean;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  reactions: { emoji: string; count: number }[];
  myReaction: string | null;
  replyTo: { id: string; author: string; preview: string } | null;
};

export type Thread = {
  id: string;
  isGroup: boolean;
  title: string;
  avatarUrl: string | null;
  other: { username: string; displayName: string; avatarUrl: string | null } | null;
  messages: ChatMessage[];
  participants: {
    userId: string;
    displayName: string;
    typing: boolean;
    online: boolean;
    lastSeenAt: string | null;
  }[];
};

export const api = {
  login: (email: string, password: string) =>
    req<{ token: string; user: PublicUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (body: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }) =>
    req<{ token: string; user: PublicUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => req<{ user: PublicUser }>("/me"),
  feed: () => req<{ posts: FeedPost[] }>("/feed"),
  createPost: (content: string) =>
    req<{ post: FeedPost }>("/posts", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  react: (id: string, emoji: string) =>
    req<{ post: FeedPost }>(`/posts/${id}/react`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    }),
  conversations: () =>
    req<{ conversations: ConversationSummary[] }>("/conversations"),
  thread: (id: string) => req<Thread>(`/conversations/${id}`),
  send: (id: string, content: string) =>
    req<{ ok: boolean; id: string }>(`/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  typing: (id: string) =>
    req(`/conversations/${id}/typing`, { method: "POST" }),
  presence: () => req("/presence", { method: "POST" }),
};
