import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import { api } from '../services/api'
import { useToast } from '../components/Toast'
import { 
  DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, defaultDropAnimationSideEffects 
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import KanbanColumn from '../components/KanbanColumn'
import KanbanIssue from '../components/KanbanIssue'
import IssueDetailDrawer from '../components/IssueDetailDrawer'

export default function BoardPage({ onLogout }) {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { addToast } = useToast()
  
  const [columns, setColumns] = useState([])
  const [issues, setIssues] = useState([])
  const [activeSprint, setActiveSprint] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [activeIssue, setActiveIssue] = useState(null)
  const [selectedIssueId, setSelectedIssueId] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const issueId = params.get('issueId')
    if (issueId) {
      setSelectedIssueId(Number(issueId))
    }
  }, [location.search])

  const [isCreatingColumn, setIsCreatingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    fetchBoardData()
  }, [id])

  const fetchBoardData = async () => {
    setLoading(true)
    try {
      const [statusRes, issueRes, sprintRes] = await Promise.all([
        api.getStatusesByProject(id),
        api.getIssuesByProject(id),
        api.getSprintsByProject(id)
      ])
      setColumns(statusRes.data || [])
      
      const sprints = sprintRes.data || []
      const currentActiveSprint = sprints.find(s => s.status === 'active')
      setActiveSprint(currentActiveSprint)

      if (currentActiveSprint) {
        const boardIssues = (issueRes.data || []).filter(i => i.sprintId === currentActiveSprint.id)
        setIssues(boardIssues)
      } else {
        setIssues([])
      }
    } catch (e) {
      addToast('Lỗi khi tải dữ liệu bảng', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event) => {
    const { active } = event
    if (active.data.current?.type === 'Issue') {
      setActiveIssue(active.data.current.issue)
    }
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return
    const activeId = active.id
    const overId = over.id
    if (activeId === overId) return

    const isActiveTask = active.data.current?.type === 'Issue'
    const isOverTask = over.data.current?.type === 'Issue'
    const isOverColumn = over.data.current?.type === 'Column'

    if (!isActiveTask) return

    const realActiveId = active.data.current.issue.id

    setIssues(prev => {
      const activeItems = [...prev]
      const activeIndex = activeItems.findIndex(i => String(i.id) === String(realActiveId))
      if (activeIndex === -1) return prev

      const activeTask = activeItems[activeIndex]

      // Dragging over another task
      if (isOverTask) {
        const overTask = over.data.current.issue
        
        // If moving to a different status, update statusId
        if (activeTask.statusId !== overTask.statusId) {
          activeTask.statusId = overTask.statusId
        }
        
        const realOverId = overTask.id
        const overIndex = activeItems.findIndex(i => String(i.id) === String(realOverId))
        return arrayMove(activeItems, activeIndex, overIndex)
      }

      // Dragging over an empty column
      if (isOverColumn) {
        const realColId = over.data.current.column.id
        if (activeTask.statusId !== realColId) {
          activeTask.statusId = realColId
          activeItems.splice(activeIndex, 1)
          activeItems.push(activeTask)
          return [...activeItems]
        }
      }
      return prev
    })
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveIssue(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isColumnDrag = active.data.current?.type === 'Column'
    
    if (isColumnDrag) {
      if (over.data.current?.type !== 'Column') return
      const activeColIndex = columns.findIndex(c => `col-${c.id}` === activeId)
      const overColIndex = columns.findIndex(c => `col-${c.id}` === overId)
      
      if (activeColIndex !== overColIndex && overColIndex !== -1 && activeColIndex !== -1) {
        setColumns(prev => arrayMove(prev, activeColIndex, overColIndex))
        addToast('Đã di chuyển Cột (Chưa lưu vào Database)', 'success')
      }
      return
    }

    // ISSUE DRAG END
    const draggedIssue = active.data.current?.issue
    if (!draggedIssue) return

    // Find where the issue ended up in our local state (updated during dragOver or dragEnd)
    const finalIssue = issues.find(i => i.id === draggedIssue.id)
    if (!finalIssue) return

    try {
      await api.moveIssue(finalIssue.id, {
        newStatusId: Number(finalIssue.statusId),
        version: finalIssue.version
      })
    } catch (e) {
      addToast('Cập nhật trạng thái thất bại', 'error')
      fetchBoardData() // Re-sync with server on failure
    }
  }

  // When the drawer updates an issue, sync it in our local state
  const handleIssueUpdated = (updatedIssue) => {
    setIssues(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i))
  }

  // Called from KanbanIssue click
  const handleIssueClick = (issueId) => {
    setSelectedIssueId(issueId)
  }

  // Handle inline issue creation
  const handleCreateIssue = async (statusId, summary) => {
    try {
      const res = await api.createIssue({
        projectId: id,
        statusId: statusId,
        sprintId: activeSprint ? activeSprint.id : null,
        type: 'task',
        summary: summary
      })
      if (res.ok) {
        addToast('Đã tạo thẻ mới', 'success')
        setIssues(prev => [...prev, res.data])
      } else {
        addToast(res.data?.message || 'Không thể tạo thẻ mới', 'error')
      }
    } catch (e) {
      addToast('Lỗi khi gọi API tạo thẻ', 'error')
    }
  }

  // Handle inline column creation
  const handleCreateColumn = async (e) => {
    e.preventDefault();
    if (!newColumnName.trim()) {
      setIsCreatingColumn(false);
      return;
    }
    try {
      const res = await api.createStatus({
        projectId: id,
        name: newColumnName,
        category: 'todo', // Default to 'todo'
        boardPosition: columns.length + 1
      });
      if (res.ok) {
        setColumns([...columns, res.data]);
        setNewColumnName('');
        setIsCreatingColumn(false);
        addToast('Đã tạo cột mới', 'success');
      } else {
        addToast(res.data?.message || 'Lỗi tạo cột', 'error');
      }
    } catch (e) {
      addToast('Lỗi khi gọi API tạo cột', 'error');
    }
  };

  const handleDeleteColumn = async (statusId) => {
    if (!window.confirm('Bạn có chắc muốn xóa cột này?')) return;
    try {
      const res = await api.deleteStatus(statusId);
      if (res.ok) {
        setColumns(prev => prev.filter(c => c.id !== statusId));
        addToast('Đã xóa cột thành công', 'success');
      } else {
        addToast(res.data?.message || 'Không thể xóa cột', 'error');
      }
    } catch (e) {
      addToast('Lỗi hệ thống khi xóa cột', 'error');
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm('Bạn có chắc muốn xóa công việc này?')) return;
    try {
      const res = await api.deleteIssue(issueId);
      if (res.ok) {
        setIssues(prev => prev.filter(i => i.id !== issueId));
        addToast('Đã xóa công việc thành công', 'success');
      } else {
        addToast(res.data?.message || 'Không thể xóa công việc', 'error');
      }
    } catch (e) {
      addToast('Lỗi hệ thống khi xóa công việc', 'error');
    }
  };

  return (
    <Layout projectId={id || 'WEB'} onLogout={onLogout}>
      
      {/* TOOLBAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#172B4D', margin: 0 }}>Bảng nội dung (Kanban)</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex' }}>
            {['K', 'M', 'D', 'H'].map((initial, i) => (
              <div key={i} title="Team Member" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: ['#0C66E4', '#1F845A', '#A54800', '#626F86'][i], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', border: '2px solid white', marginLeft: i > 0 ? '-8px' : '0' }}>
                {initial}
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#626F86' }}>Đang tải bảng...</div>
      ) : !activeSprint ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '500px' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '24px' }}>
            {/* Vòng lặp Sprint mượn ý tưởng Jira */}
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Nửa trên vòng lặp màu xanh dương */}
              <path d="M40 70 A 30 30 0 1 1 80 70 L 100 70 A 50 50 0 1 0 20 70 Z" fill="url(#paint0_linear)"/>
              <path d="M35 55 L 20 80 L 5 55 Z" fill="#2684FF"/>
              {/* Nửa dưới hướng xanh lá cây */}
              <path d="M40 70 L 80 70 L 80 80 L 40 80 Z" fill="url(#paint1_linear)"/>
              <path d="M75 55 L 105 75 L 75 95 Z" fill="#57D9A3"/>

              <defs>
                <linearGradient id="paint0_linear" x1="20" y1="20" x2="100" y2="70" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0052CC"/>
                  <stop offset="1" stopColor="#2684FF"/>
                </linearGradient>
                <linearGradient id="paint1_linear" x1="40" y1="70" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2684FF"/>
                  <stop offset="1" stopColor="#57D9A3"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#172B4D', margin: '0 0 12px 0' }}>Bắt đầu từ Backlog</h2>
          <p style={{ fontSize: '15px', color: '#5E6C84', margin: '0 0 24px 0' }}>Hãy lên kế hoạch và bắt đầu một Sprint để hiển thị công việc tại đây.</p>
          <button 
            onClick={() => navigate(`/project/${id}/backlog`)}
            style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#172B4D', border: '1px solid #DFE1E6', borderRadius: '4px', fontWeight: '500', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#F4F5F7' } }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#F4F5F7'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Đi đến Backlog
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', minHeight: '600px' }}>
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners} 
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={columns.map(c => `col-${c.id}`)} strategy={horizontalListSortingStrategy}>
              {columns.map((col) => {
                const columnIssues = issues.filter(i => i.statusId === col.id)
                return <KanbanColumn 
                  key={col.id} 
                  column={col} 
                  issues={columnIssues} 
                  onIssueClick={handleIssueClick} 
                  onCreateIssue={handleCreateIssue} 
                  onDeleteColumn={handleDeleteColumn} 
                  onDeleteIssue={handleDeleteIssue}
                />
              })}
            </SortableContext>
            
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
              {activeIssue ? <KanbanIssue issue={activeIssue} /> : null}
            </DragOverlay>
          </DndContext>
          
          {isCreatingColumn ? (
            <div style={{ width: '280px', minWidth: '280px', backgroundColor: '#F1F2F4', borderRadius: '8px', padding: '12px', height: 'fit-content' }}>
              <form onSubmit={handleCreateColumn}>
                <input 
                  autoFocus
                  placeholder="Nhập tên cột..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '2px solid #0C66E4', outline: 'none', marginBottom: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button type="submit" style={{ backgroundColor: '#0C66E4', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '3px', cursor: 'pointer', fontWeight: '500' }}>Lưu</button>
                  <button type="button" onClick={() => { setIsCreatingColumn(false); setNewColumnName(''); }} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#626F86', padding: '0 4px' }}>×</button>
                </div>
              </form>
            </div>
          ) : (
            <div onClick={() => setIsCreatingColumn(true)} style={{ width: '280px', minWidth: '280px', backgroundColor: 'transparent', border: '2px dashed #DCDFE4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', height: '48px', color: '#626F86', fontSize: '14px', fontWeight: 'bold' }}>
              + Tạo cột mới
            </div>
          )}
        </div>
      )}

      {/* Issue Detail Drawer */}
      {selectedIssueId && (
        <IssueDetailDrawer 
          projectId={id}
          issueId={selectedIssueId}
          statuses={columns}
          onClose={() => setSelectedIssueId(null)}
          onIssueUpdated={handleIssueUpdated}
          onNavigate={setSelectedIssueId}
        />
      )}

    </Layout>
  )
}
