import { SiteConfig } from "@/lib/blazeblog";

interface FooterProps {
    config: SiteConfig;
}

const Footer = ({ config }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const { siteConfig, featureFlags, footerNavigationLinks } = config;

  return (
    <footer className="bg-neutral text-neutral-content">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p>&copy; {currentYear} {siteConfig.h1}. All rights reserved.</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
             {footerNavigationLinks?.map((link, index) => (
               <a 
                 key={index}
                 href={link.url} 
                 className="hover:text-primary transition-colors"
                 target={link.url.startsWith('http') ? '_blank' : '_self'}
                 rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
               >
                 {link.label}
               </a>
             ))}
             {featureFlags.enableNewsletters && (
                <a href="#newsletter" className="hover:text-primary">Newsletter</a>
             )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
