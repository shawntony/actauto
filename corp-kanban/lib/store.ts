/**
 * Zustand 전역 상태 관리
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CorporationCard, SearchFilter, KanbanBoard } from './types'
import { fetchCorporations } from './sheets'

interface StoreState {
  // 데이터
  corporations: CorporationCard[]
  filteredCorporations: CorporationCard[]
  boards: KanbanBoard[]

  // 로딩 상태
  isLoading: boolean
  error: string | null

  // 검색 필터
  searchFilter: SearchFilter

  // 액션 - 법인
  loadCorporations: () => Promise<void>
  setSearchFilter: (filter: SearchFilter) => void
  applyFilter: () => void
  addCorporation: (corp: CorporationCard) => void
  updateCorporation: (id: string, updates: Partial<CorporationCard>) => void
  deleteCorporation: (id: string) => void
  moveCard: (cardId: string, targetBoardId: string) => void

  // 액션 - 보드
  addBoard: (title: string) => void
  updateBoard: (id: string, updates: Partial<KanbanBoard>) => void
  deleteBoard: (id: string) => void
  toggleBoardCollapsed: (id: string) => void
  reorderBoards: (boards: KanbanBoard[]) => void
}

// 기본 보드 생성
const createDefaultBoards = (): KanbanBoard[] => [
  {
    id: 'active',
    title: '활성',
    order: 0,
    collapsed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inactive',
    title: '비활성',
    order: 1,
    collapsed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'archived',
    title: '보관',
    order: 2,
    collapsed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const useStore = create<StoreState>(
  persist(
    (set, get) => ({
      corporations: [],
      filteredCorporations: [],
      boards: createDefaultBoards(),
      isLoading: false,
      error: null,
      searchFilter: { query: '' },

      loadCorporations: async () => {
        set({ isLoading: true, error: null })
        try {
          const corps = await fetchCorporations()
          // 기존 카드에 boardId가 없으면 status 기반으로 설정
          const corpsWithBoard = corps.map(corp => ({
            ...corp,
            boardId: corp.boardId || corp.status
          }))
          set({
            corporations: corpsWithBoard,
            filteredCorporations: corpsWithBoard,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load',
            isLoading: false
          })
        }
      },

      setSearchFilter: (filter) => {
        set({ searchFilter: filter })
        get().applyFilter()
      },

      applyFilter: () => {
        const { corporations, searchFilter } = get()

        let filtered = [...corporations]

        // 검색어 필터
        if (searchFilter.query) {
          const query = searchFilter.query.toLowerCase()
          filtered = filtered.filter(corp =>
            corp.name.toLowerCase().includes(query) ||
            corp.envKey.toLowerCase().includes(query) ||
            corp.description?.toLowerCase().includes(query)
          )
        }

        // 상태 필터
        if (searchFilter.status) {
          filtered = filtered.filter(corp => corp.status === searchFilter.status)
        }

        // 태그 필터
        if (searchFilter.tags && searchFilter.tags.length > 0) {
          filtered = filtered.filter(corp =>
            searchFilter.tags!.some(tag => corp.tags?.includes(tag))
          )
        }

        set({ filteredCorporations: filtered })
      },

      addCorporation: (corp) => {
        set(state => ({
          corporations: [...state.corporations, corp],
          filteredCorporations: [...state.filteredCorporations, corp]
        }))
      },

      updateCorporation: (id, updates) => {
        set(state => ({
          corporations: state.corporations.map(c =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          )
        }))
        get().applyFilter()
      },

      deleteCorporation: (id) => {
        set(state => ({
          corporations: state.corporations.filter(c => c.id !== id)
        }))
        get().applyFilter()
      },

      moveCard: (cardId, targetBoardId) => {
        set(state => ({
          corporations: state.corporations.map(c =>
            c.id === cardId
              ? { ...c, boardId: targetBoardId, updatedAt: new Date().toISOString() }
              : c
          )
        }))
        get().applyFilter()
      },

      // 보드 관리
      addBoard: (title) => {
        const newBoard: KanbanBoard = {
          id: `board_${Date.now()}`,
          title,
          order: get().boards.length,
          collapsed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        set(state => ({
          boards: [...state.boards, newBoard]
        }))
      },

      updateBoard: (id, updates) => {
        set(state => ({
          boards: state.boards.map(b =>
            b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
          )
        }))
      },

      deleteBoard: (id) => {
        const { boards, corporations } = get()
        // 기본 보드는 삭제 불가
        if (['active', 'inactive', 'archived'].includes(id)) {
          alert('기본 보드는 삭제할 수 없습니다.')
          return
        }

        // 해당 보드의 카드들을 첫 번째 보드로 이동
        const firstBoard = boards.find(b => b.id !== id)
        if (firstBoard) {
          set(state => ({
            corporations: state.corporations.map(c =>
              c.boardId === id ? { ...c, boardId: firstBoard.id } : c
            ),
            boards: state.boards.filter(b => b.id !== id)
          }))
        }
        get().applyFilter()
      },

      toggleBoardCollapsed: (id) => {
        set(state => ({
          boards: state.boards.map(b =>
            b.id === id ? { ...b, collapsed: !b.collapsed } : b
          )
        }))
      },

      reorderBoards: (boards) => {
        set({ boards })
      }
    }),
    {
      name: 'kanban-storage',
      partialize: (state) => ({ boards: state.boards })
    }
  )
)
