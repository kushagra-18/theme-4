import { getSSRBlazeBlogClient } from '@/lib/blazeblog';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Categories',
  description: 'A list of all categories.',
};

export default async function CategoriesPage() {
  const client = await getSSRBlazeBlogClient();

  // Fetch config and categories in parallel
  const [siteConfig, categoriesResult] = await Promise.all([
    client.getSiteConfig().then(res => (res as any).data || res),
    client.getCategories()
  ]);

  if (!siteConfig.featureFlags.enableCategoriesPage) {
    notFound();
  }

  const { categories } = categoriesResult;

  return (
    <div className="bg-base-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Categories</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-base-content/70">
            Browse posts by topic.
          </p>
        </div>

        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map(category => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="card bg-base-200 shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="card-body items-center text-center">
                  <h2 className="card-title">{category.name}</h2>
                  <div className="badge badge-primary">{category.postCount} Posts</div>
                  {category.description && <p className="text-sm text-base-content/70 mt-2">{category.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-semibold">No categories found.</h2>
          </div>
        )}
      </div>
    </div>
  );
}
