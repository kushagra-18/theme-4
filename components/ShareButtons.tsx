"use client";

import { useState } from 'react';
import { Post } from '@/lib/blazeblog';

interface ShareButtonsProps {
  post: Post;
}

const ShareButtons = ({ post }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);

  // Ensure we are on the client side before accessing window.location
  const postUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${post.slug}`
    : '';

  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}`;
  const linkedInShareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(post.title)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(postUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  if (!postUrl) {
    // Render placeholder on server to prevent CLS
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">Share:</span>
        <div className="btn btn-sm btn-circle btn-ghost opacity-50" aria-label="Share buttons loading">
          <div className="w-5 h-5 bg-base-content/20 rounded"></div>
        </div>
        <div className="btn btn-sm btn-circle btn-ghost opacity-50">
          <div className="w-5 h-5 bg-base-content/20 rounded"></div>
        </div>
        <div className="btn btn-sm btn-circle btn-ghost opacity-50">
          <div className="w-5 h-5 bg-base-content/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-sm">Share:</span>
      <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-circle btn-ghost" aria-label="Share on Twitter">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
      </a>
      <a href={linkedInShareUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-circle btn-ghost" aria-label="Share on LinkedIn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564z"></path></svg>
      </a>
      <button onClick={copyToClipboard} className="btn btn-sm btn-circle btn-ghost" aria-label="Copy link">
        {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="m9.55 18l-5.7-5.7l1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4z"/></svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 18q-1.25 0-2.125-.875T5 15V5q0-1.25.875-2.125T8 2h9q1.25 0 2.125.875T20 5v10q0 1.25-.875 2.125T17 18zm-3 4q-1.25 0-2.125-.875T2 19V7h2v12h11v2zM8 4V2v2zm0 14h9V5H8z"/></svg>
        )}
      </button>
    </div>
  );
};

export default ShareButtons;
