import axios from 'axios'

const API_BASE = '/api'
const apiClient = axios.create({ baseURL: API_BASE })

// Interceptor mồi thêm Token vào header
apiClient.interceptors.request.use(config => {
  const stored = localStorage.getItem('jira_auth')
  if (stored) {
    try {
      const auth = JSON.parse(stored)
      if (auth.accessToken) {
        config.headers.Authorization = `Bearer ${auth.accessToken}`
      }
    } catch (e) {
      console.error(e)
    }
  }
  return config
}, error => Promise.reject(error))

// Interceptor xử lý response để đồng nhất định dạng { ok, data } cho frontend
apiClient.interceptors.response.use(
  response => ({ ok: true, data: response.data }),
  async error => {
    const originalRequest = error.config
    
    // Nếu gặp 401 Unauthorized và chưa thử refresh
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/google')) {
      originalRequest._retry = true
      
      const stored = localStorage.getItem('jira_auth')
      if (stored) {
        try {
          const auth = JSON.parse(stored)
          if (auth.refreshToken) {
            // Gọi api refresh thủ công (dùng axios trực tiếp để tránh loop interceptor này)
            const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {
              refreshToken: auth.refreshToken
            })
            
            if (refreshRes.data && refreshRes.data.accessToken) {
              const newAuth = { ...auth, ...refreshRes.data }
              localStorage.setItem('jira_auth', JSON.stringify(newAuth))
              
              // Đính kèm token mới vào request bị lỗi và thử lại
              originalRequest.headers.Authorization = `Bearer ${newAuth.accessToken}`
              return apiClient(originalRequest)
            }
          }
        } catch (e) {
          localStorage.removeItem('jira_auth')
          if (window.location.pathname !== '/login') window.location.href = '/login'
        }
      }
    }
    
    // Trả về định dạng lỗi đồng nhất
    return { 
      ok: false, 
      data: error.response?.data || { message: error.message || 'Lỗi kết nối server!' } 
    }
  }
)

export const api = {
  // --- AUTH ENDPOINTS ---
  sendOtp: (targetIdentifier, purpose) =>
    apiClient.post('/auth/send-otp', { targetIdentifier, purpose }),

  register: (fullName, identifier, password) =>
    apiClient.post('/auth/register', { fullName, identifier, password }),

  verifyOtp: (identifier, otpCode) =>
    apiClient.post('/auth/verify-otp', { identifier, otpCode }),

  login: (identifier, password) =>
    apiClient.post('/auth/login', { identifier, password }),

  googleLogin: (idToken) =>
    apiClient.post('/auth/google', { idToken }),

  resetPassword: (identifier, otpCode, newPassword) =>
    apiClient.post('/auth/reset-password', { identifier, otpCode, newPassword }),

  // --- USER PROFILE ENDPOINTS ---
  getMe: () => apiClient.get('/users/me'),
  updateProfile: (data) => apiClient.put('/users/me', data),
  changePassword: (data) => apiClient.put('/users/me/password', data),
  searchUsers: (query) => apiClient.get('/users/search', { params: { q: query } }),

  // --- PROJECT ENDPOINTS ---
  getMyProjects: () => apiClient.get('/projects/my'),
  createProject: (data) => apiClient.post('/projects', data),
  getProject: (projectId) => apiClient.get(`/projects/${projectId}`),

  // --- BOARD / ISSUE ENDPOINTS ---
  getStatusesByProject: (projectId) => apiClient.get(`/statuses/project/${projectId}`),
  createStatus: (data) => apiClient.post('/statuses', data),
  deleteStatus: (statusId) => apiClient.delete(`/statuses/${statusId}`),
  getIssuesByProject: (projectId) => apiClient.get(`/issues/project/${projectId}`),
  getIssuesByBoardColumn: (projectId, statusId) => apiClient.get(`/issues/board/${projectId}/${statusId}`),
  getIssue: (issueId) => apiClient.get(`/issues/${issueId}`),
  getSubtasks: (issueId) => apiClient.get(`/issues/${issueId}/subtasks`),
  createIssue: (data) => apiClient.post('/issues', data),
  updateIssue: (issueId, data) => apiClient.put(`/issues/${issueId}`, data),
  updateIssueSprint: (issueId, data) => apiClient.put(`/issues/${issueId}/sprint`, data),
  moveIssue: (issueId, data) => apiClient.put(`/issues/${issueId}/move`, data),
  deleteIssue: (issueId) => apiClient.delete(`/issues/${issueId}`),
  getMyIssues: () => apiClient.get('/issues/my'),
  toggleStar: (data) => apiClient.post('/stars', data),
  getStars: () => apiClient.get('/stars'),
  getGlobalActivity: () => apiClient.get('/activity-logs/my'),
  getViewHistory: () => apiClient.get('/view-history'),
  getIssueLinksByProject: (projectId) => apiClient.get(`/issue-links/project/${projectId}`),
  createIssueLink: (data) => apiClient.post('/issue-links', data),
  deleteIssueLink: (linkId) => apiClient.delete(`/issue-links/${linkId}`),

  // --- NOTIFICATION ENDPOINTS ---
  getNotifications: () => apiClient.get('/notifications'),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markNotificationRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.put('/notifications/mark-all-read'),

  // --- INVITATION ENDPOINTS ---
  inviteUser: (projectId, data) => apiClient.post(`/invitations/project/${projectId}`, data),
  acceptInvitation: (id) => apiClient.post(`/invitations/${id}/accept`),
  rejectInvitation: (id) => apiClient.post(`/invitations/${id}/reject`),

  // --- COMMENT ENDPOINTS ---
  getComments: (issueId) => apiClient.get(`/comments/issue/${issueId}`),
  createComment: (data) => apiClient.post('/comments', data),

  // --- ATTACHMENT ENDPOINTS ---
  getAttachments: (issueId) => apiClient.get(`/attachments/issue/${issueId}`),
  uploadAttachment: (issueId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('issueId', issueId);
    return apiClient.post('/attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // --- SPRINT ENDPOINTS ---
  getSprintsByProject: (projectId) => apiClient.get(`/sprints/project/${projectId}`),
  createSprint: (data) => apiClient.post('/sprints', data),
  updateSprint: (sprintId, data) => apiClient.put(`/sprints/${sprintId}`, data),
  deleteSprint: (sprintId) => apiClient.delete(`/sprints/${sprintId}`),
  completeSprint: (sprintId, data) => apiClient.post(`/sprints/${sprintId}/complete`, data),

  // --- PROJECT MEMBER ENDPOINTS ---
  getProjectMembers: (projectId) => apiClient.get(`/projects/${projectId}/members`),
  addProjectMember: (projectId, data) => apiClient.post(`/projects/${projectId}/members`, data),
  removeProjectMember: (projectId, userId) => apiClient.delete(`/projects/${projectId}/members/${userId}`),
  updateMemberRole: (projectId, userId, roleId) => apiClient.put(`/projects/${projectId}/members/${userId}/role`, { roleId }),
  getMyRoleInProject: (projectId) => apiClient.get(`/projects/${projectId}/my-role`),
  deleteProject: (projectId) => apiClient.delete(`/projects/${projectId}`),

  // --- ROLE ENDPOINTS ---
  getRoles: () => apiClient.get('/roles'),
  createRole: (data) => apiClient.post('/roles', data),
  updateRole: (id, data) => apiClient.put(`/roles/${id}`, data),
  deleteRole: (id) => apiClient.delete(`/roles/${id}`),

  // --- LABEL ENDPOINTS ---
  getLabelsByProject: (projectId) => apiClient.get(`/labels/project/${projectId}`),
  createLabel: (data) => apiClient.post('/labels', data),

  // --- SPACE ENDPOINTS (MOCKED) ---
  getSpaces: () => {
    // Return mock data for spaces since backend doesn't have it yet
    return Promise.resolve({
      ok: true,
      data: [
        { id: 'space-1', name: 'Công nghệ phần mềm', color: '#0C66E4' },
        { id: 'space-2', name: 'Marketing & Sales', color: '#1F845A' }
      ]
    })
  },
  createSpace: (data) => {
    // Return the created mock space
    return Promise.resolve({
      ok: true,
      data: { id: `space-${Date.now()}`, ...data }
    })
  }
}
