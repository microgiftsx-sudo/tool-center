"use client"

import { create } from "zustand"
import type { Post } from './postTypes'

interface PostState {
  selectedPost: Post | null
  isAddModalOpen: boolean
  isEditModalOpen: boolean
  isDeleteModalOpen: boolean
}

interface PostActions {
  setSelectedPost: (post: Post | null) => void
  openAddModal: () => void
  openEditModal: (post: Post) => void
  openDeleteModal: (post: Post) => void
  closeModals: () => void
}

type PostStore = PostState & PostActions

export const usePostStore = create<PostStore>((set) => ({
  // State
  selectedPost: null,
  isAddModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,

  // Actions
  setSelectedPost: (post: Post | null) => {
    set({ selectedPost: post })
  },

  openAddModal: () => {
    set({
      isAddModalOpen: true,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      selectedPost: null,
    })
  },

  openEditModal: (post: Post) => {
    set({
      isAddModalOpen: false,
      isEditModalOpen: true,
      isDeleteModalOpen: false,
      selectedPost: post,
    })
  },

  openDeleteModal: (post: Post) => {
    set({
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: true,
      selectedPost: post,
    })
  },

  closeModals: () => {
    set({
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      selectedPost: null,
    })
  },
}))