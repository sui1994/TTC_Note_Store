"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      // 既にログイン済みの場合はホームページにリダイレクト
      router.push("/");
    } else if (status !== "loading") {
      // 未ログインの場合はNextAuthの認証画面にリダイレクト
      router.push("/api/auth/signin");
    }
  }, [session, status, router]);

  // ローディング中の表示
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-lg">認証画面にリダイレクト中...</div>
    </div>
  );
}

export default Login;
