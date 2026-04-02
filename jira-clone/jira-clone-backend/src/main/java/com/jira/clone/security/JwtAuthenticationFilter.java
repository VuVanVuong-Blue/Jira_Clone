package com.jira.clone.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Bộ lọc JWT chạy trước mọi request.
 * 
 * Luồng xử lý:
 *   Request → [JwtAuthenticationFilter] → Controller
 *                    ↓
 *         Đọc Header "Authorization: Bearer <token>"
 *                    ↓
 *         Validate JWT bằng JwtUtils
 *                    ↓
 *         Nếu hợp lệ → Gắn Authentication vào SecurityContext
 *         Nếu không   → Bỏ qua (Spring Security sẽ tự trả 401)
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    public JwtAuthenticationFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String jwt = parseJwt(request);

        if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
            String userIdentifier = jwtUtils.getUserIdentifierFromJwtToken(jwt);
            Long userId = jwtUtils.getUserIdFromJwtToken(jwt);

            // Tạo Authentication object chứa thông tin user và quyền
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userId,        // Principal = userId (dùng để lấy trong Controller)
                            null,          // Credentials (không cần vì đã xác thực qua JWT)
                            List.of(new SimpleGrantedAuthority("ROLE_USER"))
                    );

            // Gắn vào SecurityContext → các @PreAuthorize, hasRole,... sẽ hoạt động
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Bóc tách JWT từ Header "Authorization: Bearer eyJhbGciOiJI..."
     */
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
