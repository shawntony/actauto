/**
 * Droppable Board 컴포넌트 - 드래그 앤 드롭 가능한 보드
 */

'use client'

import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { KanbanBoard, CorporationCard as CorporationCardType } from '@/lib/types'
import DraggableCard from '@/components/DraggableCard'
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'

interface Props {
  board: KanbanBoard
  cards: CorporationCardType[]
  onEditCard: (card: CorporationCardType) => void
  onDeleteCard: (id: string) => void
  onToggleCollapse: () => void
}

export default function DroppableBoard({
  board,
  cards,
  onEditCard,
  onDeleteCard,
  onToggleCollapse
}: Props) {
  // 보드 자체를 드래그 가능하게
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef
  } = useSortable({ id: board.id })

  // 카드 드롭 영역
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: board.id
  })

  // 두 ref를 결합하는 함수
  const setNodeRef = (node: HTMLElement | null) => {
    setSortableRef(node)
    setDroppableRef(node)
  }

  const boardStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  // 보드 색상 결정
  const getBoardColor = () => {
    if (board.id === 'active') return 'from-green-500 to-green-600 dark:from-green-600 dark:to-green-700'
    if (board.id === 'inactive') return 'from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700'
    if (board.id === 'archived') return 'from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700'
    return 'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700'
  }

  return (
    <div
      ref={setNodeRef}
      style={boardStyle}
      className={`kanban-column transition-all duration-300 ${
        isOver ? 'ring-4 ring-blue-400 dark:ring-blue-500 ring-opacity-50 scale-[1.02]' : ''
      }`}
    >
      {/* 보드 헤더 */}
      <div
        className={`bg-gradient-to-r ${getBoardColor()} rounded-t-xl p-4 mb-4 shadow-md transition-all ${
          isOver ? 'shadow-xl scale-[1.01]' : ''
        }`}
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3 flex-1">
            <button
              ref={setActivatorNodeRef}
              className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-white/20 rounded-lg transition-all hover:scale-110"
              {...attributes}
              {...listeners}
              aria-label="보드 이동"
            >
              <GripVertical className="w-5 h-5" />
            </button>
            <h2 className="font-bold flex items-center gap-2.5 text-lg">
              <span className={`w-3 h-3 bg-white rounded-full shadow-md ${isOver ? 'animate-pulse scale-125' : ''}`}></span>
              {board.title} ({cards.length})
            </h2>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse()
            }}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-all hover:scale-110"
            aria-label={board.collapsed ? '보드 펼치기' : '보드 접기'}
          >
            {board.collapsed ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 보드 내용 */}
      {!board.collapsed && (
        <div
          className={`min-h-[200px] space-y-4 p-4 rounded-lg transition-all duration-300 ${
            isOver
              ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-500 border-dashed shadow-inner'
              : 'bg-transparent border-2 border-transparent'
          }`}
        >
          {cards.map(card => (
            <DraggableCard
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}

          {cards.length === 0 && (
            <div className={`text-center py-16 rounded-xl transition-all ${
              isOver
                ? 'text-blue-600 dark:text-blue-400 font-semibold text-lg bg-blue-100/50 dark:bg-blue-900/30'
                : 'text-gray-400 dark:text-gray-600'
            }`}>
              {isOver ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 dark:bg-blue-400 rounded-full opacity-20 animate-ping"></div>
                    <svg className="w-14 h-14 animate-bounce relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <span className="font-bold">여기에 놓으세요</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-50">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span className="text-sm">카드가 없습니다</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 접힌 보드에도 드롭 영역 표시 */}
      {board.collapsed && isOver && (
        <div className="min-h-[80px] bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-500 border-dashed rounded-xl p-4 flex items-center justify-center transition-all shadow-inner">
          <div className="flex flex-col items-center gap-3 text-blue-600 dark:text-blue-400">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 dark:bg-blue-400 rounded-full opacity-20 animate-ping"></div>
              <svg className="w-10 h-10 animate-bounce relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <span className="text-sm font-bold">여기에 놓으세요</span>
          </div>
        </div>
      )}
    </div>
  )
}
