import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getEnvCheck } from "@/lib/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adtlas CRM",
  description: "CRM for leads and pipeline management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { ok, missing } = getEnvCheck();
  if (!ok) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 p-6 text-center">
            <h1 className="text-xl font-semibold text-zinc-900">Setup required</h1>
            <p className="mt-2 max-w-md text-zinc-600">
              The <code className="rounded bg-zinc-200 px-1">.env.local</code> file or some variables are missing.
              The app cannot connect to Supabase or manage sessions without them.
            </p>
            <p className="mt-4 text-sm font-medium text-zinc-700">Missing variables:</p>
            <ul className="mt-1 list-inside list-disc text-sm text-zinc-600">
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <p className="mt-6 max-w-lg text-sm text-zinc-500">
              Copy <code className="rounded bg-zinc-200 px-1">.env.local.example</code> to{" "}
              <code className="rounded bg-zinc-200 px-1">.env.local</code> in the{" "}
              <code className="rounded bg-zinc-200 px-1">adtlas-crm</code> folder and fill in the values
              (Supabase → Settings → API; and generate NEXTAUTH_SECRET).
            </p>
          </div>
        </body>
      </html>
    );
  }
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
