import Link from 'next/link';
import { SeoData } from '@/lib/blazeblog';

interface BreadcrumbsProps {
  items: SeoData['breadcrumbs'];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  if (!items || items.length === 0) {
    return null;
  }

  return null;

  // return (
  //   <div className="text-sm breadcrumbs">
  //     <ul>
  //       {items.map((item, index) => (
  //         <li key={index}>
  //           {index < items.length - 1 ? (
  //             <Link href={item.url} className="hover:underline">
  //               {item.name}
  //             </Link>
  //           ) : (
  //             // Last item is the current page, not a link
  //             <span>{item.name}</span>
  //           )}
  //         </li>
  //       ))}
  //     </ul>
  //   </div>
  // );
};

export default Breadcrumbs;
