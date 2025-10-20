import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ChatProvider } from "@/components/providers/chat-provider";
import { SidebarProvider } from "@/components/providers/sidebar-provider";
import { PersistentLayout } from "@/components/layout/persistent-layout";
import { ConditionalLayout } from "@/components/layout/conditional-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Data Bot",
  description: "AI-powered data assistant that converts natural language to SQL queries and Python scripts",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml;base64," + Buffer.from(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="16" fill="currentColor"/>
            <svg x="4" y="4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 8V4H8"/>
              <rect width="16" height="12" x="4" y="8" rx="2"/>
              <path d="M2 14h2"/>
              <path d="M20 14h2"/>
              <path d="M15 13v2"/>
              <path d="M9 13v2"/>
            </svg>
          </svg>
        `).toString('base64'),
        sizes: "32x32",
        type: "image/svg+xml",
      }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
