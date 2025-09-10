import { getSSRBlazeBlogClient } from "@/lib/blazeblog";
import NewsletterForm from "@/components/NewsletterForm";
import JsonLd from "@/components/JsonLd";
import HeroSegment from "@/components/HeroSegment";
import HomeTagsBrowser from "@/components/HomeTagsBrowser";

async function getPageData() {
  const client = await getSSRBlazeBlogClient();
  const [home, siteConfig] = await Promise.all([
    client.getHomeWithTags(),
    client.getSiteConfig(),
  ]);
  return {
    latest: home.latest,
    tagGroups: home.tags,
    siteConfig,
    seo: home.seo,
  };
}

export default async function HomePage() {

  try {
    const { latest, tagGroups, siteConfig, seo } = await getPageData();

    if ((!latest || latest.length === 0) && (!tagGroups || tagGroups.length === 0)) {
      return (
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-semibold">No posts found.</h2>
          <p>Check back later for new content!</p>
        </div>
      );
    }
    return (
      <>
        {/* JSON-LD structured data from API */}
        {seo && seo.jsonLd && seo.jsonLd.map((data, index) => (
          <JsonLd key={index} data={data} />
        ))}
        
        <div className="bg-base-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <HeroSegment config={siteConfig} />
            <HomeTagsBrowser latest={latest} tags={tagGroups} siteConfig={siteConfig} />
          </div>

          {siteConfig.featureFlags.enableNewsletters && (
              <div className="py-12">
                  <NewsletterForm />
              </div>
          )}
        </div>
      </>
    );
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold text-error">Error: Could not fetch posts.</h2>
        <p className="mt-2 text-base-content/70">
          The blog content could not be loaded at this time. Please try again later.
        </p>
      </div>
    );
  }
}
