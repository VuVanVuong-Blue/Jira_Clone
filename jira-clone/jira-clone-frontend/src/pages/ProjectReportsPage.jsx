import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { api } from '../services/api'
import { useToast } from '../components/Toast'

export default function ProjectReportsPage({ onLogout }) {
  const { id } = useParams()
  const { addToast } = useToast()

  const [issues, setIssues] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportData()
  }, [id])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const [issueRes, statusRes] = await Promise.all([
        api.getIssuesByProject(id),
        api.getStatusesByProject(id),
      ])
      setIssues(issueRes.data || [])
      setStatuses(statusRes.data || [])
    } catch (e) {
      addToast('Không thể tải dữ liệu báo cáo', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Computed stats
  const totalIssues = issues.length
  const doneStatus = statuses.find(s => s.name?.toUpperCase() === 'DONE')
  const inProgressStatus = statuses.find(s => s.name?.toUpperCase().includes('PROGRESS'))
  
  const doneCount = doneStatus ? issues.filter(i => i.statusId === doneStatus.id).length : 0
  const inProgressCount = inProgressStatus ? issues.filter(i => i.statusId === inProgressStatus.id).length : 0
  const todoCount = totalIssues - doneCount - inProgressCount

  const donePercent = totalIssues > 0 ? Math.round((doneCount / totalIssues) * 100) : 0
  const inProgressPercent = totalIssues > 0 ? Math.round((inProgressCount / totalIssues) * 100) : 0
  const todoPercent = totalIssues > 0 ? 100 - donePercent - inProgressPercent : 0

  // Priority breakdown
  const priorityCounts = {
    highest: issues.filter(i => i.priority?.toLowerCase() === 'highest').length,
    high: issues.filter(i => i.priority?.toLowerCase() === 'high').length,
    medium: issues.filter(i => i.priority?.toLowerCase() === 'medium').length,
    low: issues.filter(i => i.priority?.toLowerCase() === 'low').length,
    lowest: issues.filter(i => i.priority?.toLowerCase() === 'lowest').length,
  }
  const maxPriority = Math.max(...Object.values(priorityCounts), 1)

  // Type breakdown
  const typeCounts = {
    task: issues.filter(i => i.type?.toLowerCase() === 'task').length,
    bug: issues.filter(i => i.type?.toLowerCase() === 'bug').length,
    story: issues.filter(i => i.type?.toLowerCase() === 'story').length,
    epic: issues.filter(i => i.type?.toLowerCase() === 'epic').length,
  }

  const cardStyle = { backgroundColor: '#FFFFFF', border: '1px solid #DCDFE4', borderRadius: '8px', padding: '24px' }

  const doneDashOffset = 251.2 - (251.2 * donePercent / 100)
  const ipDashOffset = 251.2 - (251.2 * inProgressPercent / 100)

  if (loading) {
    return (
      <Layout projectId={id} onLogout={onLogout}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#626F86' }}>Đang tải báo cáo...</div>
      </Layout>
    )
  }

  return (
    <Layout projectId={id || 'WEB'} onLogout={onLogout}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#172B4D', margin: '0 0 24px 0' }}>Báo cáo dự án</h1>

      {/* Row 1: 4 Stat Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#626F86', textTransform: 'uppercase' }}>Tổng issues</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#172B4D', marginTop: '8px' }}>{totalIssues}</div>
        </div>
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#626F86', textTransform: 'uppercase' }}>Hoàn thành</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1F845A', marginTop: '8px' }}>{donePercent}%</div>
          <div style={{ fontSize: '12px', color: '#8590A2', marginTop: '2px' }}>{doneCount} / {totalIssues} issues</div>
        </div>
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#626F86', textTransform: 'uppercase' }}>Đang thực hiện</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0C66E4', marginTop: '8px' }}>{inProgressCount}</div>
        </div>
        <div style={{ ...cardStyle, flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#626F86', textTransform: 'uppercase' }}>Chưa bắt đầu</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#626F86', marginTop: '8px' }}>{todoCount}</div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        
        {/* Donut Chart - Status */}
        <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#172B4D', marginBottom: '24px', alignSelf: 'flex-start' }}>Thống kê theo trạng thái</h3>
          
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
            <svg width="180" height="180" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F1F2F4" strokeWidth="16" />
              {totalIssues > 0 && (
                <>
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1F845A" strokeWidth="16" strokeDasharray="251.2" strokeDashoffset={doneDashOffset} strokeLinecap="round" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#0C66E4" strokeWidth="16" strokeDasharray="251.2" strokeDashoffset={ipDashOffset} strokeLinecap="round" style={{ transform: `rotate(${donePercent * 3.6}deg)`, transformOrigin: '50% 50%' }} />
                </>
              )}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#172B4D' }}>{totalIssues}</div>
              <div style={{ fontSize: '11px', color: '#8590A2' }}>issues</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '24px', fontSize: '12px', color: '#626F86' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', backgroundColor: '#1F845A', borderRadius: '2px' }}></div> Done ({donePercent}%)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', backgroundColor: '#0C66E4', borderRadius: '2px' }}></div> In Progress ({inProgressPercent}%)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', backgroundColor: '#F1F2F4', borderRadius: '2px' }}></div> Todo ({todoPercent}%)</div>
          </div>
        </div>

        {/* Bar Chart - Priority */}
        <div style={{ ...cardStyle, flex: 2 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#172B4D', marginBottom: '24px' }}>Thống kê theo mức độ ưu tiên</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Cao nhất', key: 'highest', color: '#AE2A19' },
              { label: 'Cao', key: 'high', color: '#E34935' },
              { label: 'Trung bình', key: 'medium', color: '#F4AC00' },
              { label: 'Thấp', key: 'low', color: '#0052CC' },
              { label: 'Thấp nhất', key: 'lowest', color: '#4C9AFF' },
            ].map(p => (
              <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', width: '70px', color: '#626F86', flexShrink: 0 }}>{p.label}</span>
                <div style={{ flex: 1, backgroundColor: '#F1F2F4', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
                  <div style={{ width: `${(priorityCounts[p.key] / maxPriority) * 100}%`, height: '100%', backgroundColor: p.color, borderRadius: '7px', transition: 'width 0.5s ease' }}></div>
                </div>
                <span style={{ fontSize: '13px', width: '28px', color: '#172B4D', fontWeight: 'bold', textAlign: 'right' }}>{priorityCounts[p.key]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Type breakdown */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#172B4D', marginBottom: '24px' }}>Phân bổ theo loại</h3>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { label: 'Task', key: 'task', color: '#0C66E4', icon: '☑️' },
            { label: 'Bug', key: 'bug', color: '#E34935', icon: '🐛' },
            { label: 'Story', key: 'story', color: '#1F845A', icon: '📗' },
            { label: 'Epic', key: 'epic', color: '#904EE2', icon: '⚡' },
          ].map(t => (
            <div key={t.key} style={{ flex: 1, textAlign: 'center', padding: '16px', backgroundColor: '#F7F8F9', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{t.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: t.color }}>{typeCounts[t.key]}</div>
              <div style={{ fontSize: '12px', color: '#626F86', marginTop: '4px' }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Recent Issues */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#172B4D', marginBottom: '16px' }}>Issues gần đây</h3>
        {issues.slice(-5).reverse().map(iss => (
          <div key={iss.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #EBECF0', gap: '8px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: iss.type === 'bug' ? '#E34935' : iss.type === 'story' ? '#1F845A' : '#0C66E4', flexShrink: 0 }}></div>
            <span style={{ fontSize: '13px', color: '#0C66E4', fontWeight: '600', flexShrink: 0 }}>{iss.issueKey}</span>
            <span style={{ fontSize: '14px', color: '#172B4D', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iss.summary}</span>
            <span style={{ fontSize: '12px', color: '#8590A2', flexShrink: 0 }}>{iss.assigneeName || '—'}</span>
          </div>
        ))}
        {issues.length === 0 && (
          <div style={{ textAlign: 'center', color: '#8590A2', fontSize: '14px', padding: '16px' }}>Chưa có issue nào.</div>
        )}
      </div>

    </Layout>
  )
}
