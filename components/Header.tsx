'use client';

import Link from 'next/link';
import { SiteConfig } from '@/lib/blazeblog';
import Image from 'next/image';
import AutocompleteSearch from './AutocompleteSearch';
import { useState } from 'react';

interface HeaderProps {
  config: SiteConfig;
}

const Header = ({ config }: HeaderProps) => {
  const { siteConfig, featureFlags, headerNavigationLinks } = config;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };


  return (
    <header className="bg-neutral text-neutral-content">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex-shrink-0 min-w-0">
            <Link href="/" className="flex items-center space-x-3">
              {siteConfig.logoPath ? (
                <Image
                  src={siteConfig.logoPath}
                  alt={`${siteConfig.h1 || 'Logo'}`}
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
              ) : (
                <span className="text-xl font-bold whitespace-nowrap">{siteConfig.h1 || 'Blog'}</span>
              )}
            </Link>
          </div>
          
          <nav className="hidden md:flex md:items-center md:space-x-8 flex-shrink-0">{headerNavigationLinks?.map((link, index) => (
              link.children && link.children.length > 0 ? (
                <div key={index} className="relative group">
                  <details className="dropdown">
                    <summary className="cursor-pointer hover:text-primary transition-colors duration-200 whitespace-nowrap list-none flex items-center">
                      {link.label}
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 text-base-content">
                      {link.children.map((child, childIndex) => (
                        <li key={childIndex}>
                          <Link 
                            href={child.url} 
                            className="hover:bg-base-200 transition-colors duration-200"
                            target={child.url.startsWith('http') ? '_blank' : '_self'}
                            rel={child.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              ) : (
                <Link
                  key={index}
                  href={link.url}
                  className="hover:text-primary transition-colors duration-200 whitespace-nowrap"
                  target={link.url.startsWith('http') ? '_blank' : '_self'}
                  rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {link.label}
                </Link>
              )
            ))}
            {featureFlags.enableCategoriesPage && (
              <Link href="/categories" className="hover:text-primary transition-colors duration-200">
                Categories
              </Link>
            )}
            {featureFlags.enableTagsPage && (
              <Link href="/tags" className="hover:text-primary transition-colors duration-200">
                Tags
              </Link>
            )}
            {featureFlags.enableAuthorsPage && (
              <Link href="/authors" className="hover:text-primary transition-colors duration-200">
                Authors
              </Link>
            )}
          </nav>
          
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="w-full max-w-sm">
              <AutocompleteSearch />
            </div>
            
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md hover:text-primary hover:bg-neutral-focus focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors"
                aria-expanded="false"
              >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-neutral-focus">
              {headerNavigationLinks?.map((link, index) => (
                link.children && link.children.length > 0 ? (
                  <div key={index}>
                    <details className="collapse collapse-arrow">
                      <summary className="collapse-title text-sm font-medium cursor-pointer hover:text-primary transition-colors">
                        {link.label}
                      </summary>
                      <div className="collapse-content pl-4">
                        {link.children.map((child, childIndex) => (
                          <Link
                            key={childIndex}
                            href={child.url}
                            className="block px-3 py-2 text-sm hover:text-primary transition-colors"
                            target={child.url.startsWith('http') ? '_blank' : '_self'}
                            rel={child.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </details>
                  </div>
                ) : (
                  <Link
                    key={index}
                    href={link.url}
                    className="block px-3 py-2 text-sm hover:text-primary transition-colors"
                    target={link.url.startsWith('http') ? '_blank' : '_self'}
                    rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              ))}
              {featureFlags.enableCategoriesPage && (
                <Link 
                  href="/categories" 
                  className="block px-3 py-2 text-sm hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Categories
                </Link>
              )}
              {featureFlags.enableTagsPage && (
                <Link 
                  href="/tags" 
                  className="block px-3 py-2 text-sm hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tags
                </Link>
              )}
              {featureFlags.enableAuthorsPage && (
                <Link 
                  href="/authors" 
                  className="block px-3 py-2 text-sm hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Authors
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
