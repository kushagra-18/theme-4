import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "./globals.css";
import { getSSRBlazeBlogClient, SiteConfig } from "@/lib/blazeblog";

const lora = Lora({ subsets: ["latin"] });

// Helper function to fetch site config with error handling
async function getSiteConfig(): Promise<SiteConfig | null> {
  try {
    const client = await getSSRBlazeBlogClient();
    const config = await client.getSiteConfig();
    // The getSiteConfig method in the client now handles unwrapping the data
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
    // more metadata can be added here
  };
}

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ThemePreviewBar from "@/components/ThemePreviewBar";

// Placeholder for Maintenance Page
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
        <body className={lora.className}>
          <MaintenancePage />
        </body>
      </html>
    );
  }

  const theme = siteConfig.theme?.colorPalette || "retro";

  return (
    <html lang="en" data-theme={theme}>
      <body className={lora.className}>
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
