"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { usePostStore } from "@/store/posts/postStore"
import { postSchema, PostFormData } from "@/store/posts/postValidation"
import { useApiData } from "@/hooks/useApi"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function PostModal() {
  const {
    isAddModalOpen,
    isEditModalOpen,
    selectedPost,
    closeModals,
  } = usePostStore()

  const { post: createPost, put: updatePost, loading , reset } = useApiData<any>("https://jsonplaceholder.typicode.com/posts", { enableFetch: false })

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      userId: "1",
      title: "",
      body: "",
    },
  })

  const isOpen = isAddModalOpen || isEditModalOpen
  const isEdit = isEditModalOpen && selectedPost

  useEffect(() => {
    if (isOpen) {
      if (isEdit && selectedPost) {
        form.reset({
          userId: selectedPost.userId.toString(),
          title: selectedPost.title,
          body: selectedPost.body,
        })
      } else {
        form.reset({
          userId: "1",
          title: "",
          body: "",
        })
      }
    }
  }, [isOpen, isEdit, selectedPost, form])

  const onSubmit = async (data: PostFormData) => {
    try {
      const payload = {
        userId: parseInt(data.userId),
        title: data.title,
        body: data.body,
      }

      if (isEdit && selectedPost) {
        await updatePost({
          data: payload,
          customEndpoint: `https://jsonplaceholder.typicode.com/posts/${selectedPost.id}`,
          onSuccess: (res) => {
            closeModals()
            form.reset()
            toast.success("Post updated successfully!") 
            reset()
          },
          onError: (err) => {
            console.error("Failed to update post:", err)
            toast.error("Failed to update post")

          }
        })
      } else {
        await createPost({
          data: payload,
          onSuccess: (res) => {
            closeModals()
            form.reset()
            toast.success("Post created successfully!") 
            reset()
          },
          onError: (err) => {
            console.error("Failed to create post:", err)
            toast.error("Failed to create post")
          }
        })
      }
    } catch (error) {
      console.error("Failed to save post:", error)
      toast.error("Failed to save post")
    }
  }

  const handleClose = () => {
    closeModals()
    form.reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Post" : "Create New Post"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter user ID" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter post title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter post content"
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEdit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}