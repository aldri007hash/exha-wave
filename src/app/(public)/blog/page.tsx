import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function BlogPage() {
  let posts: any[] = []
  try {
    posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, slug: true, excerpt: true, image: true, createdAt: true },
    })
  } catch (error) {
    console.error("Gagal memuat blog:", error)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-heading text-4xl font-bold mb-8 text-center">Blog Exha Wave</h1>
      {posts.length === 0 ? (
        <p className="text-center text-gray-500">Belum ada artikel.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
              {post.image && <img src={post.image} alt={post.title} className="w-full h-48 object-cover rounded-xl mb-4" />}
              <h2 className="font-heading text-xl font-semibold mb-2">{post.title}</h2>
              {post.excerpt && <p className="text-gray-500 text-sm mb-4">{post.excerpt}</p>}
              <span className="text-xs text-gray-400">
                {new Date(post.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
