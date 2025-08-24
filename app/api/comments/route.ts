import { getSSRBlazeBlogClient } from '@/lib/blazeblog';
import { NextRequest, NextResponse } from 'next/server';

// POST handler to create a new comment using postId
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, authorName, authorEmail, content, parentCommentId } = body;

    if (!postId || !authorName || !authorEmail || !content) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const client = await getSSRBlazeBlogClient();
    const result = await client.createCommentByPostId({
      postId,
      authorName,
      authorEmail,
      content,
      parentCommentId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error(`Failed to create comment:`, error);
    return NextResponse.json({ message: error.message || 'Failed to create comment' }, { status: 500 });
  }
}
