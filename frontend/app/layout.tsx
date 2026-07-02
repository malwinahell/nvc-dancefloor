import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Steps2Connection",
  description: "Narzędzie do wizualizacji procesów NVC",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F9F9F7",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pl"
      className={plusJakartaSans.variable}
      style={{ colorScheme: "light" }}
    >
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#F9F9F7",
          fontFamily: `var(--font-plus-jakarta-sans), "Inter", sans-serif`,
        }}
      >
        {children}
      </body>
    </html>
  );
}
