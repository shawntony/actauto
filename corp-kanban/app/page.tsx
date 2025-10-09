/**
 * 메인 칸반보드 페이지 - Drag and Drop 지원
 */

'use client'

import { useEffect, useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useStore } from '@/lib/store'
import { CorporationCard as CorporationCardType, KanbanBoard } from '@/lib/types'
import { addCorporation, updateCorporation, deleteCorporation } from '@/lib/sheets'
import CorporationCard from '@/components/CorporationCard'
import SearchBar from '@/components/SearchBar'
import AddCardModal from '@/components/AddCardModal'
import { Plus, Loader2, Settings, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import DroppableBoard from '@/components/DroppableBoard'

export default function Home() {
  const {
    filteredCorporations,
    boards,
    isLoading,
    error,
    loadCorporations,
    setSearchFilter,
    addCorporation: addToStore,
    updateCorporation: updateInStore,
    deleteCorporation: deleteFromStore,
    moveCard,
    addBoard,
    updateBoard,
    deleteBoard,
    toggleBoardCollapsed,
    reorderBoards
  } = useStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showBoardSettings, setShowBoardSettings] = useState(false)
  const [editingCard, setEditingCard] = useState<CorporationCardType>()
  const [activeCard, setActiveCard] = useState<CorporationCardType | null>(null)
  const [activeBoard, setActiveBoard] = useState<KanbanBoard | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    loadCorporations()
  }, [loadCorporations])

  const handleAddCard = async (card: Omit<CorporationCardType, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // 법인 추가 프로세스 시작
      const response = await fetch('/api/corporations/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          corpName: card.name,
          envKey: card.envKey
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`법인 추가 작업이 시작되었습니다.\n진행 상황 페이지에서 확인하세요.`)
        window.location.href = '/progress'
      } else {
        throw new Error(result.error || '법인 추가 실패')
      }
    } catch (error) {
      alert('법인 추가에 실패했습니다.')
      console.error(error)
    }
  }

  const handleEditCard = (card: CorporationCardType) => {
    setEditingCard(card)
    setShowAddModal(true)
  }

  const handleUpdateCard = async (updates: Omit<CorporationCardType, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingCard) return

    try {
      await updateCorporation(editingCard.id, updates)
      updateInStore(editingCard.id, updates)

      // allowedEmails가 있으면 권한 부여
      if (updates.allowedEmails && updates.allowedEmails.length > 0) {
        const corp = filteredCorporations.find(c => c.id === editingCard.id)
        if (corp) {
          await fetch('/api/permissions/grant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scope: 'single',
              emails: updates.allowedEmails,
              folderId: corp.folderId,
              spreadsheetId: corp.spreadsheetId,
              role: 'writer',
              sendNotification: true
            })
          })
        }
      }

      setEditingCard(undefined)
    } catch (error) {
      alert('법인 수정에 실패했습니다.')
      console.error(error)
    }
  }

  const handleDeleteCard = async (id: string) => {
    try {
      await deleteCorporation(id)
      deleteFromStore(id)
    } catch (error) {
      alert('법인 삭제에 실패했습니다.')
      console.error(error)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event

    // 보드 드래그인지 카드 드래그인지 확인
    const board = boards.find(b => b.id === active.id)
    if (board) {
      setActiveBoard(board)
    } else {
      const card = filteredCorporations.find(c => c.id === active.id)
      setActiveCard(card || null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveCard(null)
      setActiveBoard(null)
      return
    }

    // 보드 순서 변경
    if (activeBoard) {
      const oldIndex = boards.findIndex(b => b.id === active.id)
      const newIndex = boards.findIndex(b => b.id === over.id)

      if (oldIndex !== newIndex) {
        const reorderedBoards = arrayMove(boards, oldIndex, newIndex).map((board, idx) => ({
          ...board,
          order: idx
        }))
        reorderBoards(reorderedBoards)
      }
      setActiveBoard(null)
    }
    // 카드 이동
    else if (activeCard) {
      const cardId = active.id as string
      const targetBoardId = over.id as string

      // 보드 간 이동
      if (targetBoardId.startsWith('board_') || ['active', 'inactive', 'archived'].includes(targetBoardId)) {
        moveCard(cardId, targetBoardId)
      }
      setActiveCard(null)
    }
  }

  const handleAddBoard = () => {
    const title = prompt('보드 이름을 입력하세요:')
    if (title && title.trim()) {
      addBoard(title.trim())
    }
  }

  const handleEditBoardTitle = (boardId: string, currentTitle: string) => {
    const newTitle = prompt('보드 이름을 수정하세요:', currentTitle)
    if (newTitle && newTitle.trim()) {
      updateBoard(boardId, { title: newTitle.trim() })
    }
  }

  // 보드별로 카드 그룹화
  const cardsByBoard = boards.reduce((acc, board) => {
    acc[board.id] = filteredCorporations.filter(c => c.boardId === board.id)
    return acc
  }, {} as Record<string, CorporationCardType[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 페이지 헤더 */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  회계보드
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    총 {filteredCorporations.length}개 법인
                  </span>
                  <span>·</span>
                  <span>{boards.length}개 보드</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBoardSettings(!showBoardSettings)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-105 shadow-sm"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">보드 관리</span>
              </button>

              <button
                onClick={() => {
                  setEditingCard(undefined)
                  setShowAddModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:scale-105 shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">새 법인 추가</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 보드 관리 패널 */}
      {showBoardSettings && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-b border-blue-200 dark:border-gray-600 px-4 py-4 shadow-inner">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">보드 관리</h3>
              <button
                onClick={handleAddBoard}
                className="flex items-center gap-1.5 text-sm px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                보드 추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {boards.map(board => (
                <div
                  key={board.id}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all hover:scale-102"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{board.title}</span>
                  <button
                    onClick={() => handleEditBoardTitle(board.id, board.title)}
                    className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  {!['active', 'inactive', 'archived'].includes(board.id) && (
                    <button
                      onClick={() => {
                        if (confirm(`"${board.title}" 보드를 삭제하시겠습니까?`)) {
                          deleteBoard(board.id)
                        }
                      }}
                      className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-6">
        {/* 검색 바 */}
        <SearchBar onSearch={setSearchFilter} />

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <span className="mt-4 text-gray-600 dark:text-gray-400 font-medium">로딩 중...</span>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">잠시만 기다려주세요</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-800 dark:text-red-300 mb-1">오류 발생</h3>
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Drag and Drop 칸반 보드 */}
        {!isLoading && !error && (
          <>
            {isMounted ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={boards.map(b => b.id)} strategy={horizontalListSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {boards.map(board => (
                      <DroppableBoard
                        key={board.id}
                        board={board}
                        cards={cardsByBoard[board.id] || []}
                        onEditCard={handleEditCard}
                        onDeleteCard={handleDeleteCard}
                        onToggleCollapse={() => toggleBoardCollapsed(board.id)}
                      />
                    ))}
                  </div>
                </SortableContext>

                {/* Drag Overlay */}
                <DragOverlay>
                  {activeCard ? (
                    <div className="rotate-3 scale-110 shadow-2xl cursor-grabbing opacity-95">
                      <CorporationCard
                        card={activeCard}
                        onEdit={() => {}}
                        onDelete={() => {}}
                      />
                    </div>
                  ) : activeBoard ? (
                    <div className="opacity-90 scale-105 shadow-2xl cursor-grabbing">
                      <div className={`bg-gradient-to-r ${
                        activeBoard.id === 'active' ? 'from-green-500 to-green-600' :
                        activeBoard.id === 'inactive' ? 'from-yellow-500 to-yellow-600' :
                        activeBoard.id === 'archived' ? 'from-gray-500 to-gray-600' :
                        'from-blue-500 to-blue-600'
                      } rounded-t-xl p-4 shadow-lg backdrop-blur-sm`}>
                        <h2 className="font-bold text-white flex items-center gap-2">
                          <span className="w-3 h-3 bg-white rounded-full shadow-md animate-pulse"></span>
                          {activeBoard.title} ({(cardsByBoard[activeBoard.id] || []).length})
                        </h2>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {boards.map(board => (
                  <div key={board.id} className="kanban-column">
                    <div className={`bg-gradient-to-r ${
                      board.id === 'active' ? 'from-green-500 to-green-600' :
                      board.id === 'inactive' ? 'from-yellow-500 to-yellow-600' :
                      board.id === 'archived' ? 'from-gray-500 to-gray-600' :
                      'from-blue-500 to-blue-600'
                    } rounded-t-lg p-3 mb-4`}>
                      <h2 className="font-bold text-white flex items-center gap-2">
                        <span className="w-3 h-3 bg-white rounded-full"></span>
                        {board.title} ({(cardsByBoard[board.id] || []).length})
                      </h2>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* 추가/수정 모달 */}
      <AddCardModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingCard(undefined)
        }}
        onSave={editingCard ? handleUpdateCard : handleAddCard}
        editingCard={editingCard}
      />
    </div>
  )
}
