import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { api } from '../services/api'
import { useToast } from '../components/Toast'
import IssueDetailDrawer from '../components/IssueDetailDrawer'
import EditSprintModal from '../components/EditSprintModal'
import CompleteSprintModal from '../components/CompleteSprintModal'
import { 
  DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, defaultDropAnimationSideEffects 
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import BacklogDroppableArea from '../components/BacklogDroppableArea'
import BacklogDraggableIssue from '../components/BacklogDraggableIssue'
import ErrorBoundary from '../components/ErrorBoundary'

export default function BacklogPage({ onLogout }) {
  const { id } = useParams()
  const { addToast } = useToast()

  const [sprints, setSprints] = useState([])
  const [issues, setIssues] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState({})
  const [selectedIssueId, setSelectedIssueId] = useState(null)

  // Quick-create issue
  const [creatingIn, setCreatingIn] = useState(null) // 'backlog' or sprint id
  const [newSummary, setNewSummary] = useState('')

  // Sprint action modals
  const [editingSprint, setEditingSprint] = useState(null)
  const [completingSprint, setCompletingSprint] = useState(null)

  // Drag and drop state
  const [activeIssue, setActiveIssue] = useState(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    fetchBacklogData()
  }, [id])

  const fetchBacklogData = async () => {
    setLoading(true)
    try {
      const [sprintRes, issueRes, statusRes] = await Promise.all([
        api.getSprintsByProject(id),
        api.getIssuesByProject(id),
        api.getStatusesByProject(id),
      ])
      setSprints(sprintRes.data || [])
      setIssues(issueRes.data || [])
      setStatuses(statusRes.data || [])

      // Expand all sections by default
      const expanded = { backlog: true }
      ;(sprintRes.data || []).forEach(s => expanded[s.id] = true)
      setExpandedSections(expanded)
    } catch (e) {
      addToast('Không thể tải Backlog', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getSprintIssues = (sprintId) => issues.filter(i => i.sprintId === sprintId)
  const getBacklogIssues = () => issues.filter(i => !i.sprintId)

  const handleQuickCreate = async (sprintId) => {
    if (!newSummary.trim()) return
    try {
      const res = await api.createIssue({
        projectId: Number(id),
        type: 'task',
        summary: newSummary.trim(),
        sprintId: sprintId || null,
      })
      setIssues([...issues, res.data])
      setNewSummary('')
      setCreatingIn(null)
      addToast('Đã tạo issue', 'success')
    } catch (e) {
      addToast('Tạo issue thất bại', 'error')
    }
  }

  const handleStartSprint = async (sprintId) => {
    try {
      await api.updateSprint(sprintId, { status: 'active' })
      addToast('Sprint đã bắt đầu!', 'success')
      fetchBacklogData()
    } catch(e) {
      addToast('Lỗi khởi động Sprint', 'error')
    }
  }

  const handleDeleteSprint = async (sprintId) => {
    if(!window.confirm('Bạn có chắc chắn muốn xóa Sprint này không? Các issue sẽ được đưa về Backlog.')) return
    try {
      await api.deleteSprint(sprintId)
      addToast('Đã xóa Sprint', 'success')
      fetchBacklogData()
    } catch(e) {
      addToast('Lỗi khi xóa Sprint', 'error')
    }
  }

  const handleCreateSprint = async () => {
    try {
      const sprintNum = sprints.length + 1
      const now = new Date()
      const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      const res = await api.createSprint({
        projectId: Number(id),
        name: `Sprint ${sprintNum}`,
        startDate: now.toISOString(),
        endDate: end.toISOString(),
      })
      if (res.ok) {
        setSprints([...sprints, res.data])
        setExpandedSections(prev => ({ ...prev, [res.data.id]: true }))
        addToast(`Đã tạo Sprint ${sprintNum}`, 'success')
      } else {
        addToast(res.data?.message || 'Tạo Sprint thất bại', 'error')
      }
    } catch (e) {
      addToast('Tạo Sprint thất bại', 'error')
    }
  }

  const formatSprintDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  const renderIssueRow = (iss) => (
    <BacklogDraggableIssue key={iss.id} issue={iss} onClick={() => setSelectedIssueId(iss.id)} />
  )

  const handleDragStart = (event) => {
    const { active } = event
    if (active.data.current?.type === 'Issue') {
      setActiveIssue(active.data.current.issue)
    }
  }

  const handleDragEnd = async (event) => {
    setActiveIssue(null)
    const { active, over } = event
    if (!over) return

    if (active.data.current?.type === 'Issue' && over.data.current?.type === 'SprintArea') {
      const issue = active.data.current.issue
      
      let targetSprintId = null
      if (over.id !== 'backlog') {
        const idStr = String(over.id).replace('sprint-', '')
        targetSprintId = Number(idStr)
      }
      
      if (issue.sprintId === targetSprintId) return // nothing to do
      
      // Optimistic update
      setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, sprintId: targetSprintId } : i))
      
      try {
        await api.updateIssueSprint(issue.id, { sprintId: targetSprintId })
      } catch (e) {
        addToast('Lỗi dời Issue. Khôi phục dữ liệu.', 'error')
        fetchBacklogData()
      }
    }
  }

  const renderCreateRow = (sectionKey) => (
    creatingIn === sectionKey ? (
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', backgroundColor: '#FFFFFF', gap: '8px' }}>
        <input
          autoFocus
          value={newSummary}
          onChange={e => setNewSummary(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleQuickCreate(sectionKey === 'backlog' ? null : sectionKey); if (e.key === 'Escape') { setCreatingIn(null); setNewSummary('') } }}
          placeholder="Nhập tiêu đề issue rồi nhấn Enter..."
          style={{ flex: 1, height: '32px', border: '2px solid #4C9AFF', borderRadius: '3px', padding: '0 8px', fontSize: '14px', outline: 'none' }}
        />
        <button onClick={() => { setCreatingIn(null); setNewSummary('') }} style={{ background: 'none', border: 'none', color: '#626F86', cursor: 'pointer', fontSize: '14px' }}>Hủy</button>
      </div>
    ) : (
      <div
        onClick={() => setCreatingIn(sectionKey)}
        style={{ padding: '12px 16px', backgroundColor: '#FFFFFF', color: '#626F86', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'color 0.2s' }}
        onMouseOver={e => e.currentTarget.style.color = '#0C66E4'}
        onMouseOut={e => e.currentTarget.style.color = '#626F86'}
      >
        + Tạo issue
      </div>
    )
  )

  if (loading) {
    return (
      <Layout projectId={id} onLogout={onLogout}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#626F86' }}>Đang tải Backlog...</div>
      </Layout>
    )
  }

  return (
    <ErrorBoundary>
    <Layout projectId={id || 'WEB'} onLogout={onLogout}>
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#172B4D', margin: 0 }}>Backlog</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', width: '200px' }}>
            <input type="text" placeholder="Tìm kiếm backlog..." style={{ width: '100%', height: '36px', backgroundColor: '#FFFFFF', border: '2px solid #DCDFE4', borderRadius: '4px', padding: '0 12px', fontSize: '14px', outline: 'none' }} />
          </div>
        </div>
      </div>

      {/* SPRINT SECTIONS */}
      {Array.isArray(sprints) && sprints.map(sprint => {
        const sprintIssues = getSprintIssues(sprint.id)
        return (
          <div key={sprint.id} style={{ backgroundColor: '#F7F8F9', border: '1px solid #DCDFE4', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
            <div 
              onClick={() => toggleSection(sprint.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F1F2F4', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#626F86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedSections[sprint.id] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#172B4D' }}>
                  {sprint.name} {sprint.startDate && sprint.endDate ? `(${formatSprintDate(sprint.startDate)} - ${formatSprintDate(sprint.endDate)})` : ''}
                </span>
                <span style={{ fontSize: '12px', color: '#626F86' }}>{sprintIssues.length} issues</span>
                {sprint.status && (
                  <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '3px', backgroundColor: sprint.status === 'active' ? '#E9F2FF' : '#F1F2F4', color: sprint.status === 'active' ? '#0C66E4' : '#626F86' }}>
                    {sprint.status === 'active' ? 'Đang chạy' : sprint.status === 'closed' ? 'Đã xong' : 'Chưa bắt đầu'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {sprint.status !== 'closed' && sprint.status !== 'active' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleStartSprint(sprint.id) }}
                    style={{ height: '28px', padding: '0 12px', backgroundColor: '#F1F2F4', color: '#172B4D', fontSize: '13px', fontWeight: 'bold', border: '1px solid #DCDFE4', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Bắt đầu Sprint
                  </button>
                )}
                {sprint.status === 'active' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCompletingSprint(sprint) }}
                    style={{ height: '28px', padding: '0 12px', backgroundColor: '#E9F2FF', color: '#0C66E4', fontSize: '13px', fontWeight: 'bold', border: '1px solid #0C66E4', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Hoàn thành Sprint
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingSprint(sprint) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#626F86', fontSize: '13px', fontWeight: '600', textDecoration: 'underline' }}
                >
                  Sửa
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSprint(sprint.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E34935', fontSize: '13px', fontWeight: '600', textDecoration: 'underline' }}
                >
                  Xóa
                </button>
              </div>
            </div>
            
            {expandedSections[sprint.id] && (
              <BacklogDroppableArea id={sprint.id} isSprintClosed={sprint.status === 'closed'}>
                {sprintIssues.length > 0 ? sprintIssues.map(renderIssueRow) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#8590A2', fontSize: '14px' }}>
                    Kéo thả issue vào đây hoặc tạo mới bên dưới.
                  </div>
                )}
                {renderCreateRow(sprint.id)}
              </BacklogDroppableArea>
            )}
          </div>
        )
      })}

      {/* BACKLOG SECTION */}
      <div style={{ backgroundColor: '#F7F8F9', border: '1px solid #DCDFE4', borderRadius: '8px', overflow: 'hidden' }}>
        <div 
          onClick={() => toggleSection('backlog')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F1F2F4', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#626F86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedSections['backlog'] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M9 18l6-6-6-6"/>
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#172B4D' }}>Backlog</span>
            <span style={{ fontSize: '12px', color: '#626F86' }}>{getBacklogIssues().length} issues</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); handleCreateSprint() }}
            style={{ height: '28px', padding: '0 12px', backgroundColor: '#F1F2F4', color: '#172B4D', fontSize: '13px', fontWeight: 'bold', border: '1px solid #DCDFE4', borderRadius: '4px', cursor: 'pointer' }}
          >
            Tạo Sprint
          </button>
        </div>
        
        {expandedSections['backlog'] && (
              <BacklogDroppableArea id="backlog" isSprintClosed={false}>
            {getBacklogIssues().length > 0 ? getBacklogIssues().map(renderIssueRow) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#8590A2', fontSize: '14px' }}>
                Backlog trống. Tạo issue mới để bắt đầu!
              </div>
            )}
            {renderCreateRow('backlog')}
          </BacklogDroppableArea>
        )}
      </div>

      {/* Issue Detail Drawer */}
      {selectedIssueId && (
        <IssueDetailDrawer 
          projectId={id}
          issueId={selectedIssueId}
          statuses={statuses}
          onClose={() => setSelectedIssueId(null)}
          onIssueUpdated={(updated) => {
            if (updated) {
              setIssues(prev => prev.map(i => i.id === updated.id ? updated : i))
            } else {
              // If updated is null/undefined, it means the issue was deleted
              fetchBacklogData()
            }
          }}
          onNavigate={setSelectedIssueId}
        />
      )}

      {/* Editing Sprint Modal */}
      {editingSprint && (
        <EditSprintModal 
          sprint={editingSprint}
          onClose={() => setEditingSprint(null)}
          onUpdated={() => { setEditingSprint(null); fetchBacklogData() }}
        />
      )}

      {completingSprint && (
        <CompleteSprintModal
          sprint={completingSprint}
          issues={issues.filter(i => i.sprintId === completingSprint.id)}
          statuses={statuses}
          futureSprints={sprints.filter(s => s.status === 'future' || s.status == null)}
          onClose={() => setCompletingSprint(null)}
          onCompleted={() => { setCompletingSprint(null); fetchBacklogData() }}
        />
      )}

      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
        {activeIssue ? <BacklogDraggableIssue issue={activeIssue} /> : null}
      </DragOverlay>

      </DndContext>
    </Layout>
    </ErrorBoundary>
  )
}
