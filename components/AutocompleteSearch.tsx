"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

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
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data);
      setIsOpen(data.length > 0);
    } catch (error) {
      console.error('Failed to fetch search results:', error);
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
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                id="search-autocomplete"
                name="q"
                className="block w-full bg-base-100 py-2 pl-10 pr-3 border border-transparent rounded-md leading-5 focus:outline-none focus:bg-base-200 focus:border-base-300 focus:ring-0 sm:text-sm"
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
