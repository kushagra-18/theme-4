import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/lib/blazeblog';

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const postUrl = `/${post.slug}`;
  const categoryUrl = `/category/${post.category?.slug}`;

  return (
    <article className="card card-compact md:card-normal bg-base-100 shadow-xl transition-shadow hover:shadow-2xl">
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
        <h2 className="card-title text-xl md:text-2xl font-bold">
          <Link href={postUrl} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="text-base-content/70">{post.excerpt}</p>
        <div className="card-actions justify-start items-center mt-4">
          <div className="flex items-center gap-2 text-sm">
            {/* Assuming author image isn't available in the provided API spec */}
            {/* <div className="avatar">
              <div className="w-8 h-8 rounded-full">
                <Image src={post.author.image || `https://i.pravatar.cc/40?u=${post.user.username}`} alt={post.user.username} width={40} height={40} />
              </div>
            </div> */}
            <span className="font-medium">{post.user.username}</span>
            <span className="text-base-content/50">&middot;</span>
            <time dateTime={post.publishedAt || post.createdAt || post.updatedAt} className="text-base-content/50">
              {new Date(post.publishedAt || post.createdAt || post.updatedAt!).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
