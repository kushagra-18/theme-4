"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createBlazeBlogClient } from '@/lib/blazeblog';

interface SearchResult {
  title: string;
  slug: string;
  excerpt: string;
}

const AutocompleteSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const fetchResults = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const client = createBlazeBlogClient();
      const { posts } = await client.searchPosts(searchQuery);
      setResults(posts.slice(0, 5)); // Limit to 5 results
      setIsOpen(posts.length > 0);
    } catch (error) {
      console.error('Failed to fetch search results:', error);
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetchResults = useCallback(debounce(fetchResults, 300), []);

  useEffect(() => {
    debouncedFetchResults(query);
  }, [query, debouncedFetchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative max-w-md w-full lg:max-w-xs" ref={searchRef}>
        <label htmlFor="search-autocomplete" className="sr-only">Search</label>
        <div className="relative">
            <input
                id="search-autocomplete"
                name="q"
                className="input input-bordered input-sm w-full bg-base-100/80 text-base-content placeholder:text-base-content/60 border-base-300/50 focus:border-primary focus:bg-base-100"
                placeholder="Search..."
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length > 1 && setIsOpen(true)}
            />
        </div>
        {isOpen && (
            <div className="absolute mt-1 w-full rounded-md shadow-lg bg-base-200 ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                    {isLoading ? (
                        <div className="px-4 py-2 text-sm">Loading...</div>
                    ) : (
                        results.length > 0 ? (
                            results.map(post => (
                                <Link
                                    key={post.slug}
                                    href={`/${post.slug}`}
                                    onClick={handleResultClick}
                                    className="block px-4 py-2 text-sm hover:bg-base-300"
                                >
                                    <p className="font-bold">{post.title}</p>
                                    <p className="text-xs text-base-content/70 truncate">{post.excerpt}</p>
                                </Link>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-sm">No results found.</div>
                        )
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default AutocompleteSearch;
