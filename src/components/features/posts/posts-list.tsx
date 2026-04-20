"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePostStore } from "@/store/posts/postStore"
import { useApiData } from "@/hooks/useApi"
import PostItem from "./post-item"
import PostModal from "./post-modal"
import type { Post } from "@/types/posts"
import { Plus, Search, RefreshCw, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { toast } from "sonner"

export default function PostsList() {
  const { openAddModal } = usePostStore()
  
  // Use useApiData for external API calls
  const { 
    get: fetchPosts, 
    delete: deletePost, 
    loading, 
    fetchError, 
    clearFetchError
  } = useApiData<Post>("https://jsonplaceholder.typicode.com/posts", { 
    enableFetch: false 
  })
  
  const [posts, setPosts] = useState<Post[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])

  // Load posts with proper error handling following plan pattern
  const loadPosts = async () => {
    try {
      const response = await fetchPosts("https://jsonplaceholder.typicode.com/posts")
      if (Array.isArray(response)) {
        setPosts(response)
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error)
      toast.error("Failed to load posts")
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.userId.toString().includes(searchTerm)
      )
      setFilteredPosts(filtered)
    } else {
      setFilteredPosts(posts)
    }
  }, [posts, searchTerm])

  const handleDelete = async (post: Post) => {
    if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
      try {
        await deletePost({
          customEndpoint: `https://jsonplaceholder.typicode.com/posts/${post.id}`,
          onSuccess: () => {
            setPosts(prev => prev.filter(p => p.id !== post.id))
            toast.success("Post deleted successfully!")
          },
          onError: (err) => {
            console.error("Failed to delete post:", err)
            toast.error("Failed to delete post")
          }
        })
      } catch (error) {
        console.error("Failed to delete post:", error)
        toast.error("Failed to delete post")
      }
    }
  }

  const handleRefresh = () => {
    loadPosts()
    toast.success("Posts refreshed!")
  }

  const clearError = () => {
    clearFetchError()
  }

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Posts</h1>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Post
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Posts ({filteredPosts.length})</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Post
          </Button>
        </div>
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {fetchError}
            <Button 
              variant="link" 
              className="p-0 ml-2 h-auto"
              onClick={clearError}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search posts by title, content, or user ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredPosts.length === 0 && !loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm ? "No posts found matching your search." : "No posts available."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <PostModal />
    </div>
  )
}