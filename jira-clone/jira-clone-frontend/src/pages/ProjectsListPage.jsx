import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { api } from '../services/api'
import { useToast } from '../components/Toast'
import CreateProjectModal from '../components/CreateProjectModal'

export default function ProjectsListPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('worked')
  const [projects, setProjects] = useState([])
  const [myIssues, setMyIssues] = useState([])
  const [activities, setActivities] = useState([])
  const [viewHistory, setViewHistory] = useState([])
  const [stars, setStars] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [allStatuses, setAllStatuses] = useState({}) // Store statuses per project
  
  const { addToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [projRes, issueRes, viewRes, starRes, activityRes] = await Promise.all([
        api.getMyProjects(),
        api.getMyIssues(),
        api.getViewHistory(),
        api.getStars(),
        api.getGlobalActivity()
      ])
      
      if (projRes.ok) {
        setProjects(projRes.data)
        // Fetch statuses for each project for quick move
        const statusMap = {}
        for (const p of projRes.data) {
          const sRes = await api.getStatusesByProject(p.id)
          if (sRes.ok) statusMap[p.id] = sRes.data
        }
        setAllStatuses(statusMap)
      }
      if (issueRes.ok) setMyIssues(issueRes.data)
      if (starRes.ok) setStars(starRes.data)
      if (activityRes.ok) setActivities(activityRes.data)

    } catch (e) {
      addToast('Không thể tải dữ liệu. Vui lòng thử lại.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStar = async (issueId, isStarred, e) => {
    e.stopPropagation()
    try {
      const res = await api.toggleStar({ issueId })
      if (res.ok) {
        addToast(res.data.message, 'success')
        // Refresh stars list
        const sRes = await api.getStars()
        if (sRes.ok) setStars(sRes.data)
      }
    } catch (e) {
      addToast('Lỗi khi đánh dấu sao', 'error')
    }
  }

  const handleToggleProjectStar = async (projectId, e) => {
    e.stopPropagation()
    try {
      const res = await api.toggleStar({ projectId })
      if (res.ok) {
        addToast(res.data.message, 'success')
        const sRes = await api.getStars()
        if (sRes.ok) setStars(sRes.data)
      }
    } catch (e) {
      addToast('Lỗi khi đánh dấu sao dự án', 'error')
    }
  }

  const handleQuickStatusChange = async (issueId, newStatusId, e) => {
    e.stopPropagation()
    try {
      const res = await api.updateIssue(issueId, { statusId: Number(newStatusId) })
      if (res.ok) {
        addToast('Đã cập nhật trạng thái', 'success')
        // Update local issue state
        setMyIssues(prev => prev.map(i => i.id === issueId ? { ...i, statusId: res.data.statusId, statusName: res.data.statusName } : i))
        const aRes = await api.getGlobalActivity()
        if (aRes.ok) setActivities(aRes.data)
      }
    } catch (e) {
      addToast('Lỗi cập nhật trạng thái', 'error')
    }
  }

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}/board`)
  }

  const handleIssueClick = (issue) => {
    navigate(`/projects/${issue.projectId || issue.project?.id}/board?issueId=${issue.id}`)
  }

  const tabs = [
    { id: 'worked', label: 'Hoạt động gần đây' },
    { id: 'assigned', label: 'Giao cho tôi' },
    { id: 'starred', label: 'Đã đánh dấu' },
    { id: 'projects', label: 'Tất cả dự án' }
  ]

  const isIssueStarred = (issueId) => stars.some(s => s.issueId === issueId)
  const isProjectStarred = (projectId) => stars.some(s => s.projectId === projectId)

  const renderTabContent = () => {
    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#626F86' }}>Đang tải công việc của bạn...</div>

    switch (activeTab) {
      case 'worked':
        return renderActivityFeed()

      case 'assigned':
        return renderIssueList(myIssues, "Các công việc đang được giao cho bạn.")

      case 'starred':
        return renderStars()

      case 'projects':
        return renderProjectGrid()

      default:
        return null
    }
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const now = new Date()
    const d = new Date(dateStr)
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'vừa xong'
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    return `${Math.floor(diff / 86400)} ngày trước`
  }

  const renderActivityFeed = () => {
    if (!activities || activities.length === 0) {
      return renderIssueList([], "Bạn chưa có hoạt động nào gần đây.")
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activities.map((act, index) => {
          const actionText = parseAction(act);
          const payload = act.payload || {};
          
          return (
            <div 
              key={`activity-${act.id || index}`}
              onClick={() => handleIssueClick({id: act.issueId, projectId: act.projectId})}
              style={{ 
                display: 'flex', gap: '16px', padding: '16px', backgroundColor: '#FFF', border: '1px solid #DCDFE4', borderRadius: '12px', cursor: 'pointer',
                transition: 'transform 0.1s ease',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.005)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: act.userAvatarUrl ? 'transparent' : '#0C66E4', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                {act.userAvatarUrl ? <img src={act.userAvatarUrl} style={{width:'100%', height:'100%', objectFit: 'cover'}} /> : act.userFullName.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', color: '#172B4D', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{act.userFullName}</span>
                  <span style={{ color: '#626F86' }}>{actionText}</span>
                  <span style={{ fontWeight: '600', color: '#0C66E4' }}>{act.issueKey}</span>
                </div>
                
                {/* HIỂN THỊ CHI TIẾT THAY ĐỔI ĐỂ FE ĐẸP HƠN */}
                {act.actionType === 'UPDATE_STATUS' && payload.newStatus && (
                   <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', backgroundColor: '#F1F2F4', padding: '2px 8px', borderRadius: '3px', color: '#44546F' }}>{payload.oldStatus || 'NONE'}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#626F86" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      <span style={{ fontSize: '12px', backgroundColor: '#E9F2FF', padding: '2px 8px', borderRadius: '3px', color: '#0052CC', fontWeight: '600' }}>{payload.newStatus}</span>
                   </div>
                )}

                <div style={{ fontSize: '15px', fontWeight: '500', color: '#172B4D', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.issueSummary}</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '12px', color: '#626F86' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                     {act.projectName}
                  </span>
                  <span>•</span>
                  <span>{timeAgo(act.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )
  }

  const parseAction = (act) => {
    switch (act.actionType) {
      case 'CREATE_ISSUE': return 'đã tạo công việc'
      case 'UPDATE_STATUS': return 'đã chuyển trạng thái'
      case 'UPDATE_ISSUE': return 'đã cập nhật thông tin'
      case 'COMMENT': return 'đã bình luận vào'
      default: return 'đã cập nhật'
    }
  }

  const renderIssueList = (items, emptyMsg) => {
    if (!items || items.length === 0) {
      return (
        <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#F7F8F9', borderRadius: '8px' }}>
          <div style={{ fontSize: '16px', color: '#172B4D', fontWeight: '600', marginBottom: '8px' }}>Trống trải quá!</div>
          <p style={{ color: '#626F86', fontSize: '14px' }}>{emptyMsg}</p>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map(issue => {
          const starred = isIssueStarred(issue.id)
          const pStatuses = allStatuses[issue.projectId] || []

          return (
          <div 
            key={`issue-${issue.id}`} 
            onClick={() => handleIssueClick(issue)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px 20px', 
              backgroundColor: '#FFF', 
              border: '1px solid #DCDFE4', 
              borderRadius: '10px', 
              cursor: 'pointer',
              transition: 'all 0.2s',
              gap: '12px'
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#0C66E4'}
            onMouseOut={e => e.currentTarget.style.borderColor = '#DCDFE4'}
          >
            <button 
              onClick={(e) => handleToggleStar(issue.id, starred, e)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={starred ? '#F4AC00' : 'none'} stroke={starred ? '#F4AC00' : '#44546F'} strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: '#0C66E4', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '10px' }}>
                {issue.type?.charAt(0).toUpperCase() || 'T'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#172B4D' }}>{issue.summary}</div>
                <div style={{ fontSize: '12px', color: '#626F86' }}>{issue.issueKey} • {issue.projectName}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select 
                value={issue.statusId}
                onClick={e => e.stopPropagation()}
                onChange={(e) => handleQuickStatusChange(issue.id, e.target.value, e)}
                style={{ 
                  borderRadius: '4px', border: 'none', backgroundColor: '#F1F2F4', padding: '6px 10px', fontSize: '12px', fontWeight: '600', color: '#44546F', cursor: 'pointer', outline: 'none'
                }}
              >
                {pStatuses.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          )
        })}
      </div>
    )
  }

  const renderViewHistory = () => {
    if (!viewHistory || viewHistory.length === 0) return renderIssueList([], "Bạn chưa xem công việc nào gần đây.")
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {viewHistory.map(h => (
          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: '1px solid #DCDFE4', borderRadius: '12px', cursor: 'pointer' }} onClick={() => h.issueId ? handleIssueClick({id: h.issueId, projectId: h.projectId}) : handleProjectClick(h.projectId)}>
             <div style={{ width: '32px', height: '32px', backgroundColor: h.issueId ? '#0C66E4' : '#1F845A', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                {h.issueId ? 'I' : 'P'}
             </div>
             <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#172B4D' }}>{h.issueSummary || h.projectName}</div>
                <div style={{ fontSize: '12px', color: '#626F86' }}>{h.issueKey ? `${h.issueKey} • ` : ''} Xem lúc {new Date(h.viewedAt).toLocaleString()}</div>
             </div>
          </div>
        ))}
      </div>
    )
  }

  const renderStars = () => {
    if (!stars || stars.length === 0) return renderIssueList([], "Bạn chưa đánh dấu sao mục nào.")
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {stars.map(s => (
          <div 
            key={s.id} 
            onClick={() => s.issueId ? handleIssueClick({id: s.issueId, projectId: s.projectId}) : handleProjectClick(s.projectId)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: '1px solid #DCDFE4', borderRadius: '12px', cursor: 'pointer'
            }}
          >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="#F4AC00" stroke="#F4AC00" style={{ flexShrink: 0 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
             <div style={{ width: '32px', height: '32px', backgroundColor: s.issueId ? '#0C66E4' : (s.projectIconUrl || '#1F845A'), borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                {s.issueId ? 'I' : 'P'}
             </div>
             <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#172B4D' }}>{s.issueSummary || s.projectName}</div>
                <div style={{ fontSize: '12px', color: '#626F86' }}>{s.issueKey ? `${s.issueKey} • ` : ''} Dự án: {s.projectName}</div>
             </div>
          </div>
        ))}
      </div>
    )
  }

  const renderProjectGrid = () => {
    if (projects.length === 0) return renderIssueList([], "Bạn chưa tham gia dự án nào.")

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {projects.map(project => {
          const starred = isProjectStarred(project.id)
          return (
          <div 
            key={project.id} 
            onClick={() => handleProjectClick(project.id)}
            style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid #DCDFE4', 
              borderRadius: '16px', 
              padding: '24px', 
              cursor: 'pointer', 
              boxShadow: '0 2px 4px rgba(9,30,66,0.05)',
              transition: 'all 0.3s cubic-bezier(0.15, 0, 0.5, 1)',
              position: 'relative'
            }}
            onMouseOver={e => {
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(9,30,66,0.08)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(9,30,66,0.05)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <button 
              onClick={(e) => handleToggleProjectStar(project.id, e)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={starred ? '#F4AC00' : 'none'} stroke={starred ? '#F4AC00' : '#44546F'} strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                backgroundColor: project.iconUrl || '#0C66E4', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#FFF', 
                fontSize: '24px',
                fontWeight: 'bold' 
              }}>
                {project.name ? project.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#172B4D' }}>{project.name}</div>
                <div style={{ fontSize: '13px', color: '#626F86', marginTop: '4px' }}>{project.keyPrefix} • {project.templateType || 'Scrum Project'}</div>
              </div>
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}/board`) }}
                style={{ flex: 1, height: '32px', backgroundColor: '#F1F2F4', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', color: '#44546F', cursor: 'pointer' }}
              >
                Bảng
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}/settings`) }}
                style={{ width: '32px', height: '32px', backgroundColor: '#F1F2F4', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#44546F" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
            </div>
          </div>
          )
        })}
      </div>
    )
  }

  return (
    <Layout onLogout={onLogout}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '64px' }}>
        
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Công việc của bạn</h1>
            <p style={{ margin: 0, color: '#626F86', fontSize: '16px' }}>Trung tâm điều khiển và quản lý hoạt động cá nhân.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            style={{ 
              height: '44px', 
              padding: '0 24px', 
              backgroundColor: '#0C66E4', 
              color: '#FFFFFF', 
              fontSize: '14px', 
              fontWeight: '600', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(12, 102, 228, 0.25)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#0052CC'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#0C66E4'}
          >
            Tạo dự án mới
          </button>
        </header>

        <nav style={{ display: 'flex', borderBottom: '1px solid #DCDFE4', marginBottom: '32px', gap: '16px' }}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                padding: '8px 4px 16px 4px', 
                background: 'none', 
                border: 'none', 
                borderBottom: activeTab === tab.id ? '3px solid #0C66E4' : '3px solid transparent', 
                color: activeTab === tab.id ? '#0C66E4' : '#626F86', 
                fontSize: '15px', 
                fontWeight: '600', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main style={{ minHeight: '500px' }}>
          {renderTabContent()}
        </main>

      </div>

      {showModal && (
        <CreateProjectModal 
          onClose={() => setShowModal(false)}
          onProjectCreated={(newProject) => {
            setProjects(prev => [...prev, { ...newProject, membersCount: 1 }])
            setActiveTab('projects')
          }}
        />
      )}
    </Layout>
  )
}
