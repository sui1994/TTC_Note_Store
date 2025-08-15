"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { signOut, useSession } from "next-auth/react";

const Header = () => {
  const { data: session, status } = useSession();

  return (
    <header className="bg-slate-600 text-gray-50 shadow-lg">
      <nav className="flex items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold">
          Book Commerce
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            ホーム
          </Link>
          {status === "loading" ? (
            <div className="text-gray-300 px-3 py-2">読み込み中...</div>
          ) : session ? (
            <>
              <Link href="/profile" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                プロフィール
              </Link>
              <Link href="/api/auth/signout" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                ログアウト
              </Link>
              <Link href="/profile">
                <Image width={50} height={50} alt="profile_icon" src={session.user?.image || "/default_icon.png"} className="rounded-full" />
              </Link>
            </>
          ) : (
            <>
              <Link href="/api/auth/signin" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                ログイン
              </Link>
              <Link href="/api/auth/signin">
                <Image width={50} height={50} alt="default_icon" src="/default_icon.png" className="rounded-full border-2 border-gray-300 hover:border-white transition-colors" />
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
