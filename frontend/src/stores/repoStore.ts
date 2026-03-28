import { create } from 'zustand'

interface RepoStore {
  selectedOwner: string | null
  selectedRepoName: string | null
  setSelectedRepo: (owner: string | null, repoName: string | null) => void
}

export const useRepoStore = create<RepoStore>((set) => ({
  selectedOwner: null,
  selectedRepoName: null,
  setSelectedRepo: (owner, repoName) => set({ selectedOwner: owner, selectedRepoName: repoName }),
}))
