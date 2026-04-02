import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

export default function GlobalSearchDropdown({ onClose, searchTerm = '' }) {
  const [history, setHistory] = useState([]);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [histRes, userRes, projRes] = await Promise.all([
          api.getGlobalActivity().catch(() => ({ ok: false, data: [] })),
          api.searchUsers('').catch(() => ({ ok: false, data: [] })),
          api.getMyProjects().catch(() => ({ ok: false, data: [] }))
        ]);
        if (histRes.ok) setHistory(histRes.data || []);
        if (userRes.ok) setMembers((userRes.data || []).slice(0, 5));
        if (projRes.ok) setProjects(projRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredHistory = history.filter(h => 
    (h.issueKey + ' ' + h.issueSummary).toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.projectKey?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const toggleUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };
  // Common styles
  const sectionTitleStyle = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: '700',
    color: '#5E6C84',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontSize: '11px',
    marginBottom: '16px'
  }

  const itemHover = (e) => (e.currentTarget.style.backgroundColor = '#091E420F')
  const itemOut = (e) => (e.currentTarget.style.backgroundColor = 'transparent')
  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    borderRadius: '3px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    textDecoration: 'none'
  }

  const badgeStyle = {
    padding: '4px 12px',
    backgroundColor: '#F4F5F7',
    color: '#42526E',
    fontSize: '11px',
    fontWeight: '600',
    borderRadius: '16px',
    cursor: 'pointer'
  }

  return (
    <>
      <div 
        style={{ position: 'fixed', inset: 0, zIndex: 110 }} 
        onClick={onClose}
      />
      <div style={{
        position: 'absolute',
        top: '40px',
        left: 'calc(50% - 30px)', // Căn chỉnh lại để cân đối với thanh search 280px
        transform: 'translateX(-50%)',
        width: '680px',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 8px 16px -4px rgba(9,30,66,0.25), 0 0 1px rgba(9,30,66,0.31)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 120,
        overflow: 'hidden',
        border: '1px solid #DFE1E6'
      }}>
        {/* Main 2-column layout */}
        <div style={{ display: 'flex', minHeight: '400px' }}>
          
          {/* Left Column: History & Context */}
          <div style={{ width: '60%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Projects Section */}
            <section>
              <h3 style={sectionTitleStyle}>{searchTerm ? 'Kết quả tìm kiếm dự án' : 'Dự án'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {loading ? (
                  <div style={{ fontSize: '13px', color: '#626F86', padding: '8px' }}>Đang tải dự án...</div>
                ) : filteredProjects.length > 0 ? (
                  filteredProjects.map(p => (
                    <Link key={p.id} to={`/projects/${p.id}/board`} onClick={onClose} style={itemStyle} onMouseOver={itemHover} onMouseOut={itemOut}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: '#36B37E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                         {p.iconUrl ? <img src={p.iconUrl} alt="p" style={{width:'100%', borderRadius:'4px'}}/> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#172B4D' }}>{p.name}</span>
                        <span style={{ fontSize: '11px', color: '#626F86', textTransform: 'uppercase' }}>Dự án • {p.projectKey}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  searchTerm && <div style={{ fontSize: '13px', color: '#626F86', padding: '8px' }}>Không tìm thấy dự án phù hợp.</div>
                )}
              </div>
            </section>

            {/* Recently Viewed */}
            <section>
              <h3 style={sectionTitleStyle}>{searchTerm ? 'Sự kiện & Issue liên quan' : 'Đã xem gần đây'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {!loading && filteredHistory.length > 0 ? (
                  filteredHistory.map(item => (
                    <Link key={item.id} to={`/projects/${item.projectId}/board`} onClick={onClose} style={itemStyle} onMouseOver={itemHover} onMouseOut={itemOut}>
                      <div style={{ width: '20px', height: '20px', backgroundColor: '#0C66E4', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#172B4D' }}>{item.issueKey} {item.issueSummary}</span>
                        <span style={{ fontSize: '12px', color: '#626F86' }}>{item.projectName}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  !loading && !searchTerm && <div style={{ fontSize: '13px', color: '#626F86', padding: '8px' }}>Chưa có lịch sử xem.</div>
                )}
              </div>
            </section>

            
          </div>

          {/* Right Column: Filters */}
          <div style={{ width: '40%', padding: '24px', backgroundColor: '#FAFBFC', borderLeft: '1px solid #DFE1E6', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Last Updated */}
            <section>
              <h3 style={sectionTitleStyle}>Cập nhật lần cuối</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ ...badgeStyle, backgroundColor: '#E9F2FF', color: '#0C66E4' }} onMouseOver={e => e.currentTarget.style.backgroundColor='#DEEBFF'} onMouseOut={e => e.currentTarget.style.backgroundColor='#E9F2FF'}>Mọi lúc</span>
                <span style={badgeStyle} onMouseOver={e => e.currentTarget.style.backgroundColor='#EBECF0'} onMouseOut={e => e.currentTarget.style.backgroundColor='#F4F5F7'}>Hôm nay</span>
                <span style={badgeStyle} onMouseOver={e => e.currentTarget.style.backgroundColor='#EBECF0'} onMouseOut={e => e.currentTarget.style.backgroundColor='#F4F5F7'}>Hôm qua</span>
                <span style={badgeStyle} onMouseOver={e => e.currentTarget.style.backgroundColor='#EBECF0'} onMouseOut={e => e.currentTarget.style.backgroundColor='#F4F5F7'}>Tuần trước</span>
              </div>
            </section>

            {/* Filter by Assignee */}
            <section>
              <h3 style={sectionTitleStyle}>Lọc theo người nhận</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {members.map(member => (
                  <label key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.includes(member.id)}
                      onChange={() => toggleUser(member.id)}
                      style={{ width: '16px', height: '16px', accentColor: '#0C66E4' }} 
                    />
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0C66E4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', overflow: 'hidden' }}>
                      {member.avatarUrl ? <img src={member.avatarUrl} alt="avt" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : member.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '13px', color: '#172B4D' }}>{member.fullName}</span>
                  </label>
                ))}
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#0C66E4' }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#DFE1E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#42526E" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </div>
                  <span style={{ fontSize: '13px', color: '#172B4D' }}>Chưa giao (Unassigned)</span>
                </label>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #DFE1E6', backgroundColor: '#F4F5F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link to="#" style={{ fontSize: '12px', fontWeight: '600', color: '#0C66E4', textDecoration: 'none' }} onMouseOver={e=>e.currentTarget.style.textDecoration='underline'} onMouseOut={e=>e.currentTarget.style.textDecoration='none'}>Bảng</Link>
            <Link to="/projects" style={{ fontSize: '12px', fontWeight: '600', color: '#0C66E4', textDecoration: 'none' }} onMouseOver={e=>e.currentTarget.style.textDecoration='underline'} onMouseOut={e=>e.currentTarget.style.textDecoration='none'}>Dự án</Link>
            <Link to="#" style={{ fontSize: '12px', fontWeight: '600', color: '#0C66E4', textDecoration: 'none' }} onMouseOver={e=>e.currentTarget.style.textDecoration='underline'} onMouseOut={e=>e.currentTarget.style.textDecoration='none'}>Bộ lọc</Link>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link to="#" style={{ fontSize: '12px', fontWeight: '600', color: '#172B4D', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }} onMouseOver={e=>e.currentTarget.style.color='#0052CC'} onMouseOut={e=>e.currentTarget.style.color='#172B4D'}>
              Xem tất cả
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
