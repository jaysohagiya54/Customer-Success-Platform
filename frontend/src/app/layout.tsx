import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Customer Success Platform",
  description: "Customer Success Insights Platform",
};

// Injected before React hydration to prevent flash of wrong theme
const themeScript = `
(function(){
  try{
    var t=localStorage.getItem('theme');
    if(t==='dark'||(t==null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){
      document.documentElement.classList.add('dark');
    }
  }catch(e){}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
