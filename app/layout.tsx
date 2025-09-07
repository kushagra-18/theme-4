import type { Metadata } from "next";
import { Lora, Inter, Roboto, Poppins, Merriweather, Open_Sans, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { getSSRBlazeBlogClient, SiteConfig } from "@/lib/blazeblog";

const lora = Lora({ subsets: ["latin"], display: "swap" });
const inter = Inter({ subsets: ["latin"], display: "swap" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], display: "swap" });
const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });

const fontClassMap: Record<string, string> = {
  lora: lora.className,
  inter: inter.className,
  roboto: roboto.className,
  poppins: poppins.className,
  merriweather: merriweather.className,
  "open sans": openSans.className,
  "source sans 3": sourceSans.className,
};

async function getSiteConfig(): Promise<SiteConfig | null> {
  try {
    const client = await getSSRBlazeBlogClient();
    const config = await client.getSiteConfig();
    return config;
  } catch (error) {
    console.error("Failed to fetch site config:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();

  if (!config) {
    return {
      title: "Blog",
      description: "An awesome blog.",
    };
  }

  return {
    title: {
      default: config.siteConfig.seoTitle || "BlazeBlog",
      template: `%s | ${config.siteConfig.seoTitle || "BlazeBlog"}`,
    },
    description: config.siteConfig.homeMetaDescription,
  };
}

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ThemePreviewBar from "@/components/ThemePreviewBar";

// Ensure responsive layout and proper initial zoom for performance
export const viewport = { width: "device-width", initialScale: 1 };

const MaintenancePage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center">
    <h1 className="text-4xl font-bold">Down for Maintenance</h1>
    <p className="mt-4 text-lg">We are currently performing maintenance. Please check back later.</p>
  </div>
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = await getSiteConfig();

  if (!siteConfig || siteConfig.featureFlags.maintenanceMode) {
    return (
      <html lang="en" data-theme="retro">
        <head>
          {/* Viewport */}
          <meta name="viewport" content="width=device-width, initial-scale=1" />

          <link rel="preconnect" href="https://static.blazeblog.co" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="//static.blazeblog.co" />

        </head>
        <body className={lora.className}>
          <MaintenancePage />
        </body>
      </html>
    );
  }

  const theme = siteConfig.theme?.colorPalette || "retro";
  const configuredFont = siteConfig.theme?.fontFamily || "poppins";
  const key = configuredFont.toLowerCase().replace(/\s+/g, "_");
  const fontClass = fontClassMap[key] || lora.className;

  return (
    <html lang="en" data-theme={theme}>
      <head>
        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="preconnect" href="https://static.blazeblog.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//static.blazeblog.co" />

      </head>
      <body className={fontClass}>
        <ThemePreviewBar />
        <div className="flex flex-col min-h-screen">
          <Header config={siteConfig} />
          <main className="flex-grow">
            {children}
          </main>
          <Footer config={siteConfig} />
        </div>
      </body>
    </html>
  );
}
