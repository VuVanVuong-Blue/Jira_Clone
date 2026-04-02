import React from 'react'
import { useDroppable } from '@dnd-kit/core'

export default function BacklogDroppableArea({ id, children, isSprintClosed, ...props }) {
  const droppableId = id === 'backlog' ? 'backlog' : `sprint-${id}`
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: {
      type: 'SprintArea',
      sprintId: id
    },
    disabled: isSprintClosed
  })

  // We can add subtle visual feedback when dragging over
  const style = {
    minHeight: '40px',
    backgroundColor: isOver && !isSprintClosed ? '#E9F2FF' : 'transparent',
    transition: 'background-color 0.2s ease',
    paddingBottom: '8px'
  }

  return (
    <div ref={setNodeRef} style={style} {...props}>
      {children}
    </div>
  )
}
