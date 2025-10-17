import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./SessionProvider";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Afghan Pets",
  description: "Afghan Pets - All your pet needs in one place",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster/>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
