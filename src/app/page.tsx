import { redirect } from "next/navigation";

// Корень — просто отправляем в ленту (middleware уведёт гостя на /login).
export default function Home() {
  redirect("/feed");
}
