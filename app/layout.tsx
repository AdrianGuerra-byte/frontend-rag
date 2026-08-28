import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apoyo clínico",
  description:
    "Prototipo académico de apoyo a la decisión clínica para el análisis visual de estudios radiográficos.",
  applicationName: "Apoyo clínico",
};

export const viewport: Viewport = {
  themeColor: "#0d5a55",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className="h-full antialiased">
      <body className="min-h-full bg-background font-sans text-ink">{children}</body>
    </html>
  );
}
