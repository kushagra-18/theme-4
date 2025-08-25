import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/lib/blazeblog';
import { BiTime, BiUser, BiCalendar } from 'react-icons/bi';

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const postUrl = `/${post.slug}`;
  const categoryUrl = `/category/${post.category?.slug}`;

    console.log(post);


  return (
    <article className="card bg-base-100 shadow-lg hover:shadow-2xl transition-shadow border-2 border-base-300">
      <Link href={postUrl}>
        <figure className="relative h-48 md:h-64">
          <Image
            src={post.featuredImage || 'https://placehold.co/1200x600'}
            alt={post.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </figure>
      </Link>
      <div className="card-body">
        <div className="flex items-center gap-2 text-sm">
          {post.category && (
            <Link href={categoryUrl} className="font-semibold text-primary hover:underline">
              {post.category.name}
            </Link>
          )}
        </div>
        <h2 className="card-title text-2xl font-serif">
          <Link href={postUrl} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="text-base-content/80 mt-2">{post.excerpt}</p>
        <div className="card-actions justify-start items-center mt-4">
          <div className="flex items-center gap-4 text-sm text-base-content/70">
            <div className="flex items-center gap-1">
              <BiUser className="w-4 h-4" />
              <span className="font-medium">{post.user.username}</span>
            </div>
            <div className="flex items-center gap-1">
              <BiCalendar className="w-4 h-4" />
              <time dateTime={post.publishedAt || post.createdAt || post.updatedAt}>
                {new Date(post.publishedAt || post.createdAt || post.updatedAt!).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            </div>
            <div className="flex items-center gap-1">
              <BiTime className="w-4 h-4" />
              <span>{post.minsRead} min read</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
