import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apoyo Clínico | Apoyo a la decisión clínica",
  description:
    "Prototipo académico de apoyo a la decisión clínica para el análisis de radiografías.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className="h-full antialiased">
      <body className="min-h-full bg-background font-sans text-ink">{children}</body>
    </html>
  );
}
