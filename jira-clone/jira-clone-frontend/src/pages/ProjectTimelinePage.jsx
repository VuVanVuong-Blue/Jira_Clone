import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../services/api';
import IssueDetailDrawer from '../components/IssueDetailDrawer';

const DAY_WIDTH = 12; // 1 ngày = 12px

// Helper to parse dates robustly (handles strings and potential arrays)
const parseDate = (d) => {
  if (!d) return null;
  if (Array.isArray(d)) {
    // Handles [YYYY, MM, DD, HH, mm]
    return new Date(d[0], d[1] - 1, d[2], d[3] || 0, d[4] || 0);
  }
  const date = new Date(d);
  return isNaN(date.getTime()) ? null : date;
};

const getDaysDiff = (date1, date2) => {
  if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
};

export default function ProjectTimelinePage({ onLogout }) {
  const { id } = useParams();
  const [issues, setIssues] = useState([]);
  const [links, setLinks] = useState([]);
  const [minDate, setMinDate] = useState(new Date());
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [dragData, setDragData] = useState(null); // { id, type: 'move'|'resize-left'|'resize-right'|'link', startX, startY, originalStartOfs, originalDuration }
  const [activeLinkTarget, setActiveLinkTarget] = useState(null); // { x, y } - Toạ độ chuột khi đang kéo dây
  const [linkingSourceId, setLinkingSourceId] = useState(null); // Lưu ID issue đang chờ nối click

  useEffect(() => {
    fetchTimelineData();
  }, [id]);

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      const [issueRes, linkRes, statusRes] = await Promise.all([
        api.getIssuesByProject(id),
        api.getIssueLinksByProject(id).catch(() => ({ ok: true, data: [] })),
        api.getStatusesByProject(id).catch(() => ({ ok: true, data: [] }))
      ]);
      
      const rawIssues = (issueRes.ok ? issueRes.data : []) || [];
      const rawLinks = (linkRes.ok ? linkRes.data : []) || [];
      const rawStatuses = (statusRes.ok ? statusRes.data : []) || [];

      const flattenIssues = (issueList, level = 0) => {
        const result = [];
        issueList.forEach(issue => {
          result.push({ ...issue, level });
          if (issue.subtasks && issue.subtasks.length > 0) {
            result.push(...flattenIssues(issue.subtasks, level + 1));
          }
        });
        return result;
      };

      const rootIssues = rawIssues.filter(item => !item.parentIssueId);
      const flattenedData = flattenIssues(rootIssues);

      let earliest = new Date().getTime();
      if (flattenedData.length > 0) {
        flattenedData.forEach(iss => {
          const sd_val = iss.startDate || iss.createdAt;
          const sd_date = parseDate(sd_val);
          if (sd_date && !isNaN(sd_date.getTime()) && sd_date.getTime() < earliest) {
            earliest = sd_date.getTime();
          }
        });
      }

      const anchorDate = new Date(earliest);
      anchorDate.setDate(1); 
      anchorDate.setHours(0, 0, 0, 0);

      const generatedMonths = [];
      const currentMonth = new Date(anchorDate);
      for (let i = 0; i < 12; i++) {
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        generatedMonths.push({
           name: `Tháng ${currentMonth.getMonth() + 1}/${currentMonth.getFullYear()}`,
           days: daysInMonth
        });
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }

      setIssues(flattenedData);
      setLinks(rawLinks);
      setStatuses(rawStatuses);
      setMinDate(anchorDate);
      setMonths(generatedMonths);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ─── ACTION HANDLERS ───
  const handleDeleteLink = async (linkId) => {
    if (window.confirm("Bạn có muốn xóa liên kết này không?")) {
      try {
        await api.deleteIssueLink(linkId);
        fetchTimelineData();
      } catch (err) {
        console.error("Lỗi xóa liên kết:", err);
      }
    }
  };

  const handleLinkClick = async (issueId) => {
    if (!linkingSourceId) {
      setLinkingSourceId(issueId);
      return;
    }
    
    if (linkingSourceId === issueId) {
      setLinkingSourceId(null);
      return;
    }

    try {
      await api.createIssueLink({
        projectId: Number(id),
        sourceIssueId: linkingSourceId,
        targetIssueId: issueId,
        linkType: 'blocks'
      });
      setLinkingSourceId(null);
      fetchTimelineData();
    } catch (err) {
      console.error("Lỗi tạo liên kết:", err);
      setLinkingSourceId(null);
    }
  };

  // ─── MOUSE HANDLERS FOR GANTT INTERACTION ───
  const handleMouseDown = (e, issueId, type) => {
    if (type === 'link') {
       e.stopPropagation();
       handleLinkClick(issueId);
       return;
    }

    e.stopPropagation();
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    const start = parseDate(issue.startDate) || parseDate(issue.createdAt) || new Date();
    const due = parseDate(issue.dueDate) || new Date(start.getTime() + 24 * 3600 * 1000 * 3);

    setDragData({
      id: issueId,
      type,
      startX: e.clientX,
      startY: e.clientY,
      originalStartOfs: getDaysDiff(minDate, start),
      originalDuration: Math.max(1, getDaysDiff(start, due))
    });
  };

  const handleMouseMove = (e) => {
    // Luôn theo dõi chuột nếu đang trong chế độ chọn link
    if (linkingSourceId) {
       const container = e.currentTarget.getBoundingClientRect();
       setActiveLinkTarget({
         x: e.clientX - container.left + e.currentTarget.scrollLeft,
         y: e.clientY - container.top + e.currentTarget.scrollTop
       });
    }

    if (!dragData) return;

    const deltaX = e.clientX - dragData.startX;
    const deltaDays = Math.round(deltaX / DAY_WIDTH);

    setIssues(prev => prev.map(iss => {
      if (iss.id !== dragData.id) return iss;

      let newStartOfs = iss.startOfs || getDaysDiff(minDate, parseDate(iss.startDate) || parseDate(iss.createdAt));
      let newDuration = iss.duration || getDaysDiff(parseDate(iss.startDate), parseDate(iss.dueDate)) || 1;

      if (dragData.type === 'move') {
        newStartOfs = dragData.originalStartOfs + deltaDays;
      } else if (dragData.type === 'resize-left') {
        newStartOfs = dragData.originalStartOfs + deltaDays;
        newDuration = dragData.originalDuration - deltaDays;
      } else if (dragData.type === 'resize-right') {
        newDuration = dragData.originalDuration + deltaDays;
      }

      if (newDuration < 1) newDuration = 1;
      
      return { ...iss, startOfs: newStartOfs, duration: newDuration, _isDirty: true };
    }));
  };

  const handleMouseUp = async (e) => {
    if (!dragData) return;
    
    const targetIssue = issues.find(i => i.id === dragData.id);
    if (targetIssue && targetIssue._isDirty) {
      try {
        const newStart = new Date(minDate.getTime() * 1 + targetIssue.startOfs * 24 * 3600 * 1000);
        const newDue = new Date(newStart.getTime() + targetIssue.duration * 24 * 3600 * 1000);
        
        await api.updateIssue(targetIssue.id, {
          startDate: newStart,
          dueDate: newDue
        });
      } catch (e) {
        console.error("Lỗi cập nhật ngày:", e);
      }
    }

    setDragData(null);
  };

  const renderedIssues = issues.map((iss, index) => {
    const start = parseDate(iss.startDate) || parseDate(iss.createdAt) || new Date();
    const due = parseDate(iss.dueDate) || new Date(start.getTime() + 24 * 3600 * 1000 * 3);

    const startOfs = iss.startOfs !== undefined ? iss.startOfs : getDaysDiff(minDate, start);
    const duration = iss.duration !== undefined ? iss.duration : Math.max(1, getDaysDiff(start, due));

    let color = '#0C66E4';
    if (iss.type === 'EPIC') color = '#8777D9';
    else if (iss.statusName === 'DONE') color = '#4BCE97';

    return {
      ...iss,
      index,
      startOfs,
      duration,
      color,
      isChild: !!iss.parentIssueId,
      level: iss.level || 0
    };
  });

  const todayOfs = getDaysDiff(minDate, new Date());
  const totalGridWidth = months.reduce((acc, m) => acc + m.days, 0) * DAY_WIDTH;

  return (
    <Layout projectId={id} onLogout={onLogout}>
      <div 
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          margin: '-32px', 
          height: 'calc(100vh - 56px)', 
          display: 'flex', 
          flexDirection: 'column', 
          backgroundColor: 'var(--color-surface)',
          overflow: 'hidden',
          userSelect: dragData ? 'none' : 'auto'
        }}
      >
        
        {/* ── HEADER TOOLBAR ── */}
        <div style={{ 
          height: '64px',
          padding: '0 var(--space-300)', 
          borderBottom: '1px solid var(--color-border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-surface)',
          zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-200)' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--color-text)' }}>Roadmap (Timeline)</h1>
            {linkingSourceId && (
              <div style={{ 
                padding: '4px 12px', backgroundColor: '#EAE6FF', color: '#403294', 
                borderRadius: '20px', fontSize: '12px', fontWeight: 600, 
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <span className="spinner-mini"></span>
                Đang chọn điểm nối tiếp theo...
                <button onClick={() => setLinkingSourceId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 800 }}>✕</button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-100)' }}>
             <button onClick={fetchTimelineData} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Làm mới</button>
          </div>
        </div>

        {/* ── GANTT CHART BODY (STICKY) ── */}
        {loading ? (
             <div style={{ padding: '24px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 Đang tải dữ liệu Timeline...
             </div>
        ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'auto', position: 'relative' }}>
          
          {/* LẼ TRÁI (LEFT PANE) - DANH SÁCH ISSUE */}
          <div style={{ 
            width: '350px', 
            minWidth: '350px', 
            borderRight: '1px solid var(--color-border)', 
            backgroundColor: 'var(--color-surface)',
            position: 'sticky',
            left: 0,
            zIndex: 15,
            boxShadow: '4px 0 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ 
              height: '44px', borderBottom: '1px solid var(--color-border)', 
              display: 'flex', alignItems: 'center', padding: '0 16px', 
              fontSize: '12px', fontWeight: 600, color: 'var(--color-text-subtle)',
              backgroundColor: 'var(--color-bg-sunken)',
              position: 'sticky', top: 0
            }}>
              <span style={{ flex: 1 }}>Tên công việc</span>
              <span style={{ width: '80px', textAlign: 'right' }}>Trạng thái</span>
            </div>
            
            {renderedIssues.map((item) => (
              <div key={item.id} style={{ 
                height: '48px', 
                borderBottom: '1px solid var(--color-border-subtle)', 
                display: 'flex', alignItems: 'center', 
                padding: `0 16px 0 ${16 + (item.level * 20)}px`,
                backgroundColor: selectedIssueId === item.id ? 'var(--color-surface-hovered)' : 'transparent',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedIssueId(item.id)}
              >
                {item.type === 'EPIC' ? (
                    <div style={{ width: '20px', height: '20px', backgroundColor: '#8777D9', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                ) : (
                  <div style={{ width: '20px', height: '20px', backgroundColor: '#0C66E4', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
                
                <span style={{ flex: 1, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: item.type === 'EPIC' ? 'var(--color-text)' : 'var(--color-text-subtle)', fontWeight: item.type === 'EPIC' ? 600 : 400 }}>
                  {item.summary}
                </span>
                
                <div style={{ width: '80px', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 4px', borderRadius: '3px', backgroundColor: '#EBECF0', color: '#42526E' }}>{item.statusName}</span>
                </div>
              </div>
            ))}
          </div>

          {/* LẼ PHẢI (RIGHT PANE) - TRỤC THỜI GIAN GANTT */}
          <div style={{ 
            width: `${totalGridWidth}px`,
            position: 'relative',
            backgroundColor: 'var(--color-bg-sunken)'
          }}>
            {/* Header Tháng */}
            <div style={{ 
              height: '44px', display: 'flex', borderBottom: '1px solid var(--color-border)', 
              backgroundColor: 'var(--color-surface)', position: 'sticky', top: 0, zIndex: 10
            }}>
              {months.map((month, idx) => (
                <div key={idx} style={{ 
                  width: `${month.days * DAY_WIDTH}px`,
                  borderRight: '1px solid var(--color-border-subtle)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 600, color: 'var(--color-text-subtle)'
                }}>
                  {month.name}
                </div>
              ))}
            </div>
            
            {/* Grid Content */}
            <div style={{ position: 'relative', height: `${renderedIssues.length * 48}px` }}>
              
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 4 }}>
                <defs>
                  <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#8590A2" />
                  </marker>
                  <marker id="arrowhead-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#0052CC" />
                  </marker>
                </defs>
                
                {/* Dây đang chờ nối (Click-to-link) */}
                {linkingSourceId && activeLinkTarget && (() => {
                  const src = renderedIssues.find(i => i.id === linkingSourceId);
                  if (!src) return null;
                  const srcX = (src.startOfs + src.duration) * DAY_WIDTH;
                  const srcY = src.index * 48 + 24;
                  const tgtX = activeLinkTarget.x;
                  const tgtY = activeLinkTarget.y;
                  const midX = srcX + Math.max(20, (tgtX - srcX) / 2);
                  const path = `M ${srcX} ${srcY} C ${midX} ${srcY}, ${midX} ${tgtY}, ${tgtX} ${tgtY}`;
                  return <path d={path} fill="none" stroke="#0052CC" strokeWidth="2" strokeDasharray="4 2" markerEnd="url(#arrowhead-active)" />;
                })()}

                {links.map(link => {
                   const src = renderedIssues.find(i => i.id === link.sourceIssueId);
                   const tgt = renderedIssues.find(i => i.id === link.targetIssueId);
                   if (!src || !tgt) return null;
                   const srcX = (src.startOfs + src.duration) * DAY_WIDTH;
                   const srcY = src.index * 48 + 24; 
                   const tgtX = tgt.startOfs * DAY_WIDTH;
                   const tgtY = tgt.index * 48 + 24;
                   
                   const midX = srcX + Math.max(15, (tgtX - srcX) / 2);
                   const pathData = `M ${srcX} ${srcY} C ${midX} ${srcY}, ${midX} ${tgtY}, ${tgtX - 4} ${tgtY}`;
                   return (
                     <g key={link.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => handleDeleteLink(link.id)}>
                        {/* Ẩn một đường rộng hơn bên dưới để dễ click */}
                        <path d={pathData} fill="none" stroke="transparent" strokeWidth="10" />
                        <path d={pathData} fill="none" stroke="#8590A2" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                        <title>Nhấn để xóa liên kết</title>
                     </g>
                   );
                })}
              </svg>

              {/* Vạch Today */}
              {todayOfs >= 0 && (
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${todayOfs * DAY_WIDTH}px`, width: '2px', backgroundColor: '#FF5630', zIndex: 8 }}></div>
              )}

              {/* GANTT BARS */}
              {renderedIssues.map((item) => {
                const isDraggingThis = dragData?.id === item.id;
                const isSourceOfLink = dragData?.type === 'link' && dragData.id === item.id;
                
                return (
                  <div key={item.id} 
                    data-issue-id={item.id}
                    style={{ 
                      position: 'absolute', 
                      top: `${item.index * 48 + 8}px`, 
                      left: `${item.startOfs * DAY_WIDTH}px`, 
                      width: `${item.duration * DAY_WIDTH}px`,
                      height: '32px',
                      backgroundColor: item.color,
                      borderRadius: '4px',
                      cursor: isSourceOfLink ? 'crosshair' : 'grab',
                      zIndex: isDraggingThis ? 100 : 9,
                      display: 'flex', alignItems: 'center', 
                      color: 'white', fontSize: '11px', fontWeight: 600, overflow: 'visible',
                      boxShadow: isDraggingThis ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
                      transition: dragData ? 'none' : 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: isDraggingThis ? '2px solid white' : 'none',
                      outline: (dragData?.type === 'link' && !isSourceOfLink) ? '2px dashed rgba(255,255,255,0.3)' : 'none', // Gợi ý vùng thả
                      pointerEvents: isSourceOfLink ? 'none' : 'auto' // Quan trọng: Bỏ qua source để thả được trúng đích bên dưới hoặc lân cận
                    }}
                    onMouseDown={(e) => handleMouseDown(e, item.id, 'move')}
                  >
                    {/* NUT RESIZE TRÁI */}
                    <div 
                      onMouseDown={(e) => handleMouseDown(e, item.id, 'resize-left')}
                      style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px', cursor: 'ew-resize', zIndex: 2 }}
                    ></div>

                    <span style={{ padding: '0 12px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', flex: 1, pointerEvents: 'none' }}>
                      {item.summary}
                    </span>

                    {/* NUT RESIZE PHẢI */}
                    <div 
                      onMouseDown={(e) => handleMouseDown(e, item.id, 'resize-right')}
                      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px', cursor: 'ew-resize', zIndex: 2 }}
                    ></div>
                    
                    {/* NÚT CHẤM TRÒN ĐỂ KÉO DÂY */}
                    <div 
                      onMouseDown={(e) => handleMouseDown(e, item.id, 'link')}
                      style={{ 
                        position: 'absolute', right: '-12px', top: '8px', width: '16px', height: '16px', 
                        backgroundColor: 'white', border: `3px solid ${item.color}`, borderRadius: '50%',
                        cursor: 'crosshair', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        pointerEvents: 'auto' // Luôn nhận sự kiện để bắt đầu kéo
                      }}
                    >
                      <div style={{ width: '4px', height: '4px', backgroundColor: item.color, borderRadius: '50%' }}></div>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>
        )}

      </div>

      {selectedIssueId && (
        <IssueDetailDrawer 
          projectId={id}
          issueId={selectedIssueId}
          statuses={statuses}
          onClose={() => setSelectedIssueId(null)}
          onIssueUpdated={() => fetchTimelineData()}
          onNavigate={setSelectedIssueId}
        />
      )}
    </Layout>
  );
}

