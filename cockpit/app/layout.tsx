import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ICT & TPRM Cockpit",
    template: "%s · ICT & TPRM Cockpit",
  },
  description:
    "ICT & Third Party Risk Management Cockpit – Management-, Arbeits- und Nachverfolgungswerkzeug (Demo-Daten)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Theme vor Hydration setzen, um Flackern zu vermeiden */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
