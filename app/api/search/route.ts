import { getSSRBlazeBlogClient } from '@/lib/blazeblog';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ message: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const client = await getSSRBlazeBlogClient();
    const { posts } = await client.searchPosts(query);
    // We only need a few fields for the autocomplete dropdown
    const results = posts.map(post => ({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
    })).slice(0, 5); // Limit to 5 results for the dropdown

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ message: 'Error fetching search results' }, { status: 500 });
  }
}
