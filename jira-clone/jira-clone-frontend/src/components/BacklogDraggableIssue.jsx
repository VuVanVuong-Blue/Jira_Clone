import React from 'react'
import { useDraggable } from '@dnd-kit/core'

export default function BacklogDraggableIssue({ issue, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `issue-${issue.id}`,
    data: {
      type: 'Issue',
      issue
    }
  })

  const getStatusBadge = (statusName) => {
    const colors = {
      'TODO': { bg: '#F1F2F4', color: '#626F86' },
      'IN PROGRESS': { bg: '#E9F2FF', color: '#0C66E4' },
      'DONE': { bg: '#DCFFF1', color: '#1F845A' },
    }
    const c = colors[statusName?.toUpperCase()] || colors['TODO']
    return c
  }
  const badge = getStatusBadge(issue.statusName)

  // Avoid translating the element directly to let DndContext DragOverlay handle visual if needed,
  // or apply transform inline if dragging without overlay. We will use DragOverlay in BacklogPage.
  // When isDragging is true, we can make the original item look faded.
  const style = {
    display: 'flex', alignItems: 'center', height: '40px', padding: '0 16px',
    borderBottom: '1px solid #EBECF0', 
    backgroundColor: isDragging ? '#F4F5F7' : '#FFFFFF', 
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
    transition: 'background 0.1s'
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      onMouseOver={e => { if(!isDragging) e.currentTarget.style.backgroundColor = '#F1F2F4' }}
      onMouseOut={e => { if(!isDragging) e.currentTarget.style.backgroundColor = '#FFFFFF' }}
    >
      <div style={{ width: '16px', height: '16px', backgroundColor: issue.type === 'bug' ? '#E34935' : issue.type === 'story' ? '#1F845A' : '#0C66E4', borderRadius: '4px', marginRight: '8px', flexShrink: 0 }}></div>
      <span style={{ fontSize: '13px', color: '#0C66E4', fontWeight: '600', marginRight: '12px', flexShrink: 0 }}>{issue.issueKey}</span>
      <span style={{ fontSize: '14px', color: '#172B4D', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.summary}</span>
      <span style={{ fontSize: '12px', color: '#626F86', width: '80px', textAlign: 'right', marginRight: '16px', flexShrink: 0 }}>{issue.assigneeName || 'Chưa giao'}</span>
      <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: badge.bg, color: badge.color, padding: '2px 6px', borderRadius: '3px', width: '100px', textAlign: 'center', flexShrink: 0 }}>
        {issue.statusName || 'TODO'}
      </span>
    </div>
  )
}
