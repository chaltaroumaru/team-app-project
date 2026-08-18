import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VALORANT Coach AI",
  description: "自分の知識を教え込んで育てる、VALORANT専属コーチAI",
};

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/knowledge", label: "ナレッジベース" },
  { href: "/train", label: "知識を教える" },
  { href: "/coach", label: "コーチに質問する" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800 bg-neutral-950/95 sticky top-0 z-10 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="font-bold tracking-tight text-lg text-red-400">
              VALORANT Coach AI
            </Link>
            <nav className="flex gap-1 text-sm">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
        <footer className="border-t border-neutral-800 py-4 text-center text-xs text-neutral-500">
          VALORANT Coach AI — 個人のナレッジベースをもとに回答するコーチングAI(MVP)
        </footer>
      </body>
    </html>
  );
}
