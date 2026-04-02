package com.jira.clone.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtils {

    // Should be placed in application.properties (e.g. jira.app.jwtSecret)
    @Value("${jira.app.jwtSecret:1234567890123456789012345678901234567890123456789012345678901234}")
    private String jwtSecret;

    @Value("${jira.app.jwtExpirationMs:86400000}") // 1 Ngày
    private int jwtExpirationMs;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateAccessToken(String userIdentifier, Long userId, String globalRole) {
        return Jwts.builder()
                .setSubject(userIdentifier)
                .claim("userId", userId)
                .claim("role", globalRole)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUserIdentifierFromJwtToken(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    public Long getUserIdFromJwtToken(String token) {
        return extractClaim(token, claims -> claims.get("userId", Long.class));
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (Exception e) {
            // Log exceptions for expired, invalid signature, etc.
        }
        return false;
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
        return claimsResolver.apply(claims);
    }
}
