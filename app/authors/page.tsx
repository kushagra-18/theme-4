import { getSSRBlazeBlogClient } from '@/lib/blazeblog';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Authors',
  description: 'A list of all authors.',
};

interface Author {
  id: number;
  username: string;
  postCount: number;
  firstName?: string;
  lastName?: string;
}

export default async function AuthorsPage() {
  const client = await getSSRBlazeBlogClient();

  // Check if authors page is enabled
  const siteConfig = await client.getSiteConfig();
  if (!siteConfig.featureFlags.enableAuthorsPage) {
    notFound();
  }

  try {
    // Get authors from the API (this might need to be adjusted based on actual endpoint)
    const response = await client.makeRequest<any>('/public/authors');
    const authors: Author[] = response.data || response;

    return (
      <div className="bg-base-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Authors</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-base-content/70">
              Browse posts by author.
            </p>
          </div>

          {authors && authors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {authors.map(author => (
                <Link
                  key={author.id}
                  href={`/author/${author.username}`}
                  className="card bg-base-200 shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="card-body items-center text-center">
                    <h2 className="card-title">
                      {author.firstName && author.lastName 
                        ? `${author.firstName} ${author.lastName}` 
                        : author.username}
                    </h2>
                    <div className="badge badge-primary">{author.postCount} Posts</div>
                    <p className="text-sm text-base-content/70">@{author.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-semibold">No authors found.</h2>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to fetch authors:', error);
    // If authors endpoint doesn't exist, return a simple message
    return (
      <div className="bg-base-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8">Authors</h1>
            <p className="text-lg text-base-content/70">
              Author listing is not available at this time.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
