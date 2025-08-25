"use client";

import { useState, useEffect } from 'react';
import { Comment, createBlazeBlogClient } from '@/lib/blazeblog';

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

const CommentSkeleton = () => (
    <div className="p-4 bg-base-300 rounded-lg animate-pulse">
        <div className="flex items-center mb-2">
            <div className="h-4 bg-base-content/20 rounded w-24"></div>
            <div className="h-3 bg-base-content/20 rounded w-16 ml-2"></div>
        </div>
        <div className="space-y-2">
            <div className="h-4 bg-base-content/20 rounded w-3/4"></div>
            <div className="h-4 bg-base-content/20 rounded w-1/2"></div>
        </div>
    </div>
);

const CommentCard = ({ comment }: { comment: Comment }) => {
    return (
        <div className="p-4 bg-base-300 rounded-lg border border-base-content/10 hover:bg-base-300/80 transition-colors">
            <div className="flex items-center mb-3">
                <div className="font-semibold text-base-content">{comment.authorName}</div>
                <div className="text-xs text-base-content/60 ml-2 bg-base-content/10 px-2 py-1 rounded-full">
                    {new Date(comment.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </div>
            <p className="text-base-content/90 leading-relaxed">{comment.content}</p>
        </div>
    )
}

const CommentSection = ({ postId, postSlug }: CommentSectionProps) => {
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

  const fetchComments = async (pageNum: number) => {
    setLoading(true);
    try {
      const client = createBlazeBlogClient();
      const response = await client.makeRequest<any>(
        `/public/posts/${postId}/comments?limit=5&page=${pageNum}`, 
        { cache: 'no-store' }
      );
      const data = {
        comments: response.data || [],
        meta: response.meta || { total: 0, page: pageNum, limit: 5, totalPages: 1 }
      };
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
            if (result.data) {
                setComments(prev => [result.data!, ...prev]);
            }
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
      <div className="mb-8 p-6 bg-base-200/50 rounded-xl border border-base-content/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Leave a Comment
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="author-name" className="label">
                <span className="label-text font-medium">Name</span>
              </label>
              <input 
                id="author-name"
                type="text" 
                placeholder="Your name" 
                className="input input-bordered w-full focus:input-primary" 
                value={authorName} 
                onChange={e => setAuthorName(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label htmlFor="author-email" className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <input 
                id="author-email"
                type="email" 
                placeholder="your.email@example.com" 
                className="input input-bordered w-full focus:input-primary" 
                value={authorEmail} 
                onChange={e => setAuthorEmail(e.target.value)} 
                required 
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="comment-content" className="label">
              <span className="label-text font-medium">Comment</span>
            </label>
            <textarea 
              id="comment-content"
              className="textarea textarea-bordered w-full h-32 focus:textarea-primary resize-none" 
              placeholder="Share your thoughts..." 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              required
            ></textarea>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button 
              type="submit" 
              className="btn btn-primary btn-wide" 
              disabled={submitting || !content.trim() || !authorName.trim() || !authorEmail.trim()}
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Comment
                </>
              )}
            </button>
            
            {(formError || formSuccess) && (
              <div className="flex-1 min-w-0">
                {formError && (
                  <div className="alert alert-error alert-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm">{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="alert alert-success alert-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm">{formSuccess}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {/* Show skeleton loading for initial load */}
        {loading && page === 1 && (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        )}
        
        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        )}
        
        {!loading && !error && comments.length === 0 && (
          <div className="text-center py-8 text-base-content/60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.172-.266l-4.244 2.827A1 1 0 005 21.172V19.828a8 8 0 117.172-14.172zM21 12c0-4.418-3.582-8-8-8s-8 3.582-8 8c0 1.47.392 2.849 1.078 4.032" />
            </svg>
            <p className="text-lg font-medium">No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        )}

        {/* Animate in comments */}
        <div className="space-y-4">
          {comments.map((comment, index) => (
            <div 
              key={comment.id} 
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CommentCard comment={comment} />
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {meta && page < meta.totalPages && (
          <div className="text-center pt-4">
            <button 
              onClick={handleLoadMore} 
              className="btn btn-outline btn-wide" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Loading more...
                </>
              ) : (
                <>
                  Load More Comments
                  <span className="badge badge-ghost ml-2">{meta.total - comments.length} remaining</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Comments count */}
        {meta && comments.length > 0 && (
          <div className="text-center text-sm text-base-content/60 border-t border-base-content/10 pt-4">
            Showing {comments.length} of {meta.total} comments
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
