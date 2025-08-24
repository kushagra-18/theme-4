import Link from 'next/link';
import { SiteConfig } from '@/lib/blazeblog';
import Image from 'next/image';

interface HeaderProps {
  config: SiteConfig;
}

const Header = ({ config }: HeaderProps) => {
  const { siteConfig, featureFlags } = config;

  return (
    <header className="bg-base-100 border-b border-base-300">
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
              <Link href="/categories" className="text-base-content hover:text-primary transition-colors duration-200">
                Categories
              </Link>
            )}
            {featureFlags.enableTagsPage && (
              <Link href="/tags" className="text-base-content hover:text-primary transition-colors duration-200">
                Tags
              </Link>
            )}
            {/* Add other navigation links here if needed */}
          </nav>
          <div className="md:hidden">
            {/* Mobile menu button can be added here */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
