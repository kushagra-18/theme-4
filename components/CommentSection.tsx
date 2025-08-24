"use client";

import { useState, useEffect } from 'react';
import { Comment } from '@/lib/blazeblog';

interface CommentSectionProps {
  postId: number;
  postSlug: string;
}

interface CommentsResponse {
    comments: Comment[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const CommentCard = ({ comment }: { comment: Comment }) => {
    return (
        <div className="p-4 bg-base-300 rounded-lg">
            <div className="flex items-center mb-2">
                <div className="font-bold">{comment.authorName}</div>
                <div className="text-xs text-base-content/70 ml-2">
                    {new Date(comment.createdAt).toLocaleString()}
                </div>
            </div>
            <p>{comment.content}</p>
            {/* Reply functionality can be added here */}
        </div>
    )
}

const CommentSection = ({ postSlug }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [meta, setMeta] = useState<CommentsResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Form state
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

import { createBlazeBlogClient } from '@/lib/blazeblog';

// ...

  const fetchComments = async (pageNum: number) => {
    setLoading(true);
    try {
      const client = createBlazeBlogClient();
      const data = await client.getComments(postSlug, pageNum, 5);
      setComments(prev => pageNum === 1 ? data.comments : [...prev, ...data.comments]);
      setMeta(data.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(page);
  }, [postSlug, page]);

  const handleLoadMore = () => {
    if (meta && page < meta.totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
        const client = createBlazeBlogClient();
        const result = await client.createCommentByPostId({
            postId, authorName, authorEmail, content
        });

        // Reset form
        setAuthorName('');
        setAuthorEmail('');
        setContent('');

        if (result.data?.status === 'approved') {
            setFormSuccess(result.message || 'Comment posted successfully!');
            setComments(prev => [result.data, ...prev]);
        } else {
            setFormSuccess(result.message || 'Thank you! Your comment is awaiting moderation.');
        }
    } catch (err: any) {
        setFormError(err.message || 'Failed to submit comment');
    } finally {
        setSubmitting(false);
    }
  }

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-4">Comments</h2>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-base-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input type="text" placeholder="Your Name" className="input input-bordered w-full" value={authorName} onChange={e => setAuthorName(e.target.value)} required />
            <input type="email" placeholder="Your Email" className="input input-bordered w-full" value={authorEmail} onChange={e => setAuthorEmail(e.target.value)} required />
        </div>
        <textarea className="textarea textarea-bordered w-full mb-4" placeholder="Write your comment..." value={content} onChange={e => setContent(e.target.value)} required></textarea>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <span className="loading loading-spinner"></span> : 'Submit Comment'}
        </button>
        {formError && <p className="text-error mt-2">{formError}</p>}
        {formSuccess && <p className="text-success mt-2">{formSuccess}</p>}
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {loading && page === 1 && <p>Loading comments...</p>}
        {error && <p className="text-error">{error}</p>}
        {!loading && comments.length === 0 && <p>No comments yet. Be the first to comment!</p>}

        {comments.map(comment => <CommentCard key={comment.id} comment={comment} />)}

        {meta && page < meta.totalPages && (
            <button onClick={handleLoadMore} className="btn btn-outline w-full" disabled={loading}>
                {loading ? 'Loading...' : 'Load More Comments'}
            </button>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
