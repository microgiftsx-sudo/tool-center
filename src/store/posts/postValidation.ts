"use client"

import { z } from "zod"

export const postSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required").min(3, "Title must be at least 3 characters"),
  body: z.string().min(1, "Body is required").min(10, "Body must be at least 10 characters"),
})

export type PostFormData = z.infer<typeof postSchema>