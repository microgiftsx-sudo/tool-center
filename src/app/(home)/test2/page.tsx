"use client"

import PostsList from "@/components/features/posts/posts-list"

export default function PostsTest2Page() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-muted-foreground">Test Page 2</h2>
      </div>
      <PostsList />
    </div>
  )
}