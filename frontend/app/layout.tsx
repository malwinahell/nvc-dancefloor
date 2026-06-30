import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Steps2Connection",
  description: "Narzędzie do wizualizacji procesów NVC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
      lang="pl" — Polish locale for screen readers
      style colorScheme="light" — tells the browser to always render
      system UI (scrollbars, inputs, form elements) in light mode,
      even when the OS is set to dark mode
    */
    <html lang="pl" style={{ colorScheme: "light" }}>
      <head>
        {/* Plus Jakarta Sans — primary typeface from the design system */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#F9F9F7" }}>
        {children}
      </body>
    </html>
  );
}
