import type { Metadata } from "next";
import "./globals.css";
import { getSSRBlazeBlogClient, SiteConfig } from "@/lib/blazeblog";

const fontCssFamilyMap: Record<string, string> = {
  lora: "'Lora', serif",
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  poppins: "'Poppins', sans-serif",
  merriweather: "'Merriweather', serif",
  "open sans": "'Open Sans', sans-serif",
  "source sans 3": "'Source Sans 3', sans-serif",
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
import NextTopLoader from "nextjs-toploader";

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
          <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Lora&family=Inter&family=Roboto:wght@400;500;700&family=Poppins:wght@400;500;700&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Open+Sans:wght@400;600;700&family=Source+Sans+3:wght@400;600;700&display=swap"
            rel="stylesheet"
          />

        </head>
        <body className="" style={{ fontFamily: fontCssFamilyMap['lora'] }}>
          <NextTopLoader color="#29d" showSpinner={false} height={3} crawl={true} />
          <MaintenancePage />
        </body>
      </html>
    );
  }

  const theme = siteConfig.theme?.colorPalette || "retro";
  const configuredFont = siteConfig.theme?.fontFamily || "poppins";
  const key = configuredFont.toLowerCase().replace(/\s+/g, "_");
  const fontCss = fontCssFamilyMap[key] || fontCssFamilyMap['lora'];

  return (
    <html lang="en" data-theme={theme}>
      <head>
        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="preconnect" href="https://static.blazeblog.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//static.blazeblog.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora&family=Inter&family=Roboto:wght@400;500;700&family=Poppins:wght@400;500;700&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Open+Sans:wght@400;600;700&family=Source+Sans+3:wght@400;600;700&display=swap"
          rel="stylesheet"
        />

      </head>
      <body className="" style={{ fontFamily: fontCss }}>
        <NextTopLoader color="#29d" showSpinner={false} height={3} crawl={true} />
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
