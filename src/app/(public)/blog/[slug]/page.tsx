import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  let post: any = null
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug: params.slug, published: true },
    })
  } catch (error) {
    console.error("Gagal memuat artikel:", error)
  }

  if (!post) return notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/blog" className="text-primary text-sm mb-4 inline-block hover:underline">← Kembali ke Blog</Link>
      {post.image && <img src={post.image} alt={post.title} className="w-full h-64 object-cover rounded-xl mb-6" />}
      <h1 className="font-heading text-4xl font-bold mb-4">{post.title}</h1>
      <p className="text-sm text-gray-500 mb-8">
        Dipublikasikan pada {new Date(post.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
      </p>
      <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  )
}
