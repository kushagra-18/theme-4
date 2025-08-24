import { getSSRBlazeBlogClient } from '@/lib/blazeblog';
import { NextRequest, NextResponse } from 'next/server';

// GET handler to fetch comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '10');

  if (!slug) {
    return NextResponse.json({ message: 'Post slug is required' }, { status: 400 });
  }

  try {
    const client = await getSSRBlazeBlogClient();
    const data = await client.getComments(slug, page, limit);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Failed to fetch comments for ${slug}:`, error);
    return NextResponse.json({ message: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST handler to create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  if (!slug) {
    return NextResponse.json({ message: 'Post slug is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { authorName, authorEmail, content, parentCommentId } = body;

    if (!authorName || !authorEmail || !content) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const client = await getSSRBlazeBlogClient();
    const result = await client.createComment({
      postSlug: slug,
      authorName,
      authorEmail,
      content,
      parentCommentId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(`Failed to create comment for ${slug}:`, error);
    return NextResponse.json({ message: 'Failed to create comment' }, { status: 500 });
  }
}
