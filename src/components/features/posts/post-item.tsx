"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePostStore } from "@/store/posts/postStore"
import type { Post } from "@/types/posts"
import { Pencil, Trash2, User } from "lucide-react"
import { toast } from "sonner"

interface PostItemProps {
  post: Post
  onDelete: (post: Post) => void
}

export default function PostItem({ post, onDelete }: PostItemProps) {
  const { openEditModal } = usePostStore()

  const handleEdit = () => {
    openEditModal(post)
    toast.info(`Editing post: ${post.title.substring(0, 30)}...`)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              User {post.userId}
            </Badge>
            <Badge variant="outline">ID: {post.id}</Badge>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
              title="Edit post"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(post)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Delete post"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {post.body}
        </p>
      </CardContent>
    </Card>
  )
}