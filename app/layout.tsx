import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RADIA",
  description:
    "Prototipo académico de apoyo a la decisión clínica con información clínica y estudios radiográficos opcionales.",
  applicationName: "RADIA",
};

export const viewport: Viewport = {
  themeColor: "#001f4d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className="h-full antialiased">
      <body className="min-h-full bg-background font-sans text-ink">{children}</body>
    </html>
  );
}
