import Link from 'next/link';
import { SiteConfig } from '@/lib/blazeblog';
import Image from 'next/image';

interface HeaderProps {
  config: SiteConfig;
}

const Header = ({ config }: HeaderProps) => {
  const { siteConfig, featureFlags } = config;

  return (
    <header className="bg-neutral text-neutral-content">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              {siteConfig.logoPath ? (
                <Image
                  src={siteConfig.logoPath}
                  alt={`${siteConfig.h1 || 'Logo'}`}
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
              ) : (
                <span className="text-xl font-bold">{siteConfig.h1 || 'Blog'}</span>
              )}
            </Link>
          </div>
          <nav className="hidden md:flex md:items-center md:space-x-8">
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
            {/* Add other navigation links here if needed */}
          </nav>
          <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
            <form action="/search" method="GET" className="max-w-md w-full lg:max-w-xs">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        id="search"
                        name="q"
                        className="block w-full bg-base-100 py-2 pl-10 pr-3 border border-transparent rounded-md leading-5 focus:outline-none focus:bg-base-200 focus:border-base-300 focus:ring-0 sm:text-sm"
                        placeholder="Search"
                        type="search"
                    />
                </div>
            </form>
          </div>
          <div className="md:hidden">
            {/* Mobile menu button can be added here */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
