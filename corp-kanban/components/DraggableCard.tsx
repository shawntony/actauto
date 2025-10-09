/**
 * Draggable Card 컴포넌트 - 드래그 가능한 법인 카드
 */

'use client'

import { useDraggable } from '@dnd-kit/core'
import { CorporationCard as CorporationCardType } from '@/lib/types'
import CorporationCard from './CorporationCard'

interface Props {
  card: CorporationCardType
  onEdit: (card: CorporationCardType) => void
  onDelete: (id: string) => void
}

export default function DraggableCard({ card, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({ id: card.id })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'z-50' : 'z-auto'} transition-opacity`}
      {...attributes}
      {...listeners}
    >
      <CorporationCard card={card} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}
