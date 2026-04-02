import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import KanbanIssue from './KanbanIssue';

export default function KanbanColumn({ column, issues, onIssueClick, onCreateIssue, onDeleteColumn, onDeleteIssue }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newIssueText, setNewIssueText] = useState('');

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newIssueText.trim()) {
      setIsCreating(false);
      return;
    }
    if (onCreateIssue) {
      onCreateIssue(column.id, newIssueText);
      setNewIssueText('');
      setIsCreating(false);
    }
  };
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: `col-${column.id}`,
    data: {
      type: 'Column',
      column
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={{ 
        width: '280px', 
        minWidth: '280px', 
        backgroundColor: '#F1F2F4', 
        borderRadius: '8px', 
        padding: '12px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        transition: transition || 'background-color 0.2s ease',
        ...style
      }}
    >
      <div 
        style={{ fontSize: '12px', fontWeight: 'bold', color: '#626F86', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div 
            {...attributes} 
            {...listeners} 
            style={{ cursor: 'grab', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8590A2' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#091E4214'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Kéo thả để di chuyển cột"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="12" r="1.5"></circle>
              <circle cx="9" cy="5" r="1.5"></circle>
              <circle cx="9" cy="19" r="1.5"></circle>
              <circle cx="15" cy="12" r="1.5"></circle>
              <circle cx="15" cy="5" r="1.5"></circle>
              <circle cx="15" cy="19" r="1.5"></circle>
            </svg>
          </div>
          <span style={{ marginLeft: '4px' }}>{column.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ backgroundColor: '#DFE1E6', padding: '2px 6px', borderRadius: '12px', fontSize: '11px', color: '#172B4D' }}>{issues.length}</span>
          {onDeleteColumn && (
            <button 
              onClick={() => onDeleteColumn(column.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '3px', color: '#626F86', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = '#FFEBE6'; e.currentTarget.style.color = '#AE2A19'; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#626F86'; }}
              title="Xóa cột"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100px', flex: 1 }}>
        <SortableContext items={issues.map(i => `task-${i.id}`)} strategy={verticalListSortingStrategy}>
          {issues.map(iss => (
            <KanbanIssue key={iss.id} issue={iss} onIssueClick={onIssueClick} onDeleteIssue={onDeleteIssue} />
          ))}
        </SortableContext>
        
        {isCreating && (
          <form onSubmit={handleCreateSubmit} style={{ backgroundColor: 'white', borderRadius: '4px', padding: '8px', boxShadow: '0 1px 2px rgba(9,30,66,0.25)' }}>
            <textarea 
              autoFocus
              value={newIssueText}
              onChange={(e) => setNewIssueText(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreateSubmit(e); } }}
              placeholder="Bạn cần làm gì?" 
              style={{ width: '100%', border: 'none', resize: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit', minHeight: '40px' }} 
            />
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsCreating(false)} style={{ backgroundColor: 'transparent', border: 'none', padding: '4px 8px', cursor: 'pointer', borderRadius: '3px', color: '#42526E' }}>Hủy</button>
              <button type="submit" style={{ backgroundColor: '#0C66E4', color: 'white', border: 'none', padding: '4px 12px', cursor: 'pointer', borderRadius: '3px', fontWeight: '500' }}>Tạo</button>
            </div>
          </form>
        )}
      </div>
      
      {!isCreating && (
        <button 
          onClick={() => setIsCreating(true)}
          style={{ height: '36px', backgroundColor: 'transparent', border: 'none', color: '#626F86', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px', cursor: 'pointer', padding: '0 8px', marginTop: '4px', transition: 'background-color 0.2s' }} 
          onMouseOver={e => e.target.style.backgroundColor = '#091E4214'} 
          onMouseOut={e => e.target.style.backgroundColor = 'transparent'}
        >
          + Tạo issue
        </button>
      )}
    </div>
  );
}
