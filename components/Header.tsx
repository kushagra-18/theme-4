import Link from 'next/link';
import { SiteConfig } from '@/lib/blazeblog';
import Image from 'next/image';
import AutocompleteSearch from './AutocompleteSearch';

interface HeaderProps {
  config: SiteConfig;
}

const Header = ({ config }: HeaderProps) => {
  const { siteConfig, featureFlags, headerNavigationLinks } = config;


  return (
    <header className="bg-neutral text-neutral-content">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 min-w-0">
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
                <span className="text-xl font-bold whitespace-nowrap">{siteConfig.h1 || 'Blog'}</span>
              )}
            </Link>
          </div>
          <nav className="hidden md:flex md:items-center md:space-x-6 flex-shrink-0">
            {headerNavigationLinks?.map((link, index) => (
              <a
                key={index}
                href={link.url}
                className="hover:text-primary transition-colors duration-200 whitespace-nowrap"
                target={link.url.startsWith('http') ? '_blank' : '_self'}
                rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {link.label}
              </a>
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
          </nav>
          <div className="flex-1 flex justify-end ml-4 min-w-0">
            <div className="w-full max-w-xs">
              <AutocompleteSearch />
            </div>
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
