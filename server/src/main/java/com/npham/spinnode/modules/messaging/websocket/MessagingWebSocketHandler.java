package com.npham.spinnode.modules.messaging.websocket;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.npham.spinnode.modules.messaging.dto.response.MessagingRealtimeEvent;
import com.npham.spinnode.security.jwt.JwtService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class MessagingWebSocketHandler extends TextWebSocketHandler {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    private final Map<Long, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = authenticate(session.getUri());
        if (userId == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Missing or invalid token"));
            return;
        }

        session.getAttributes().put("userId", userId);
        userSessions.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Object userId = session.getAttributes().get("userId");
        if (!(userId instanceof Long resolvedUserId)) {
            return;
        }

        Set<WebSocketSession> sessions = userSessions.get(resolvedUserId);
        if (sessions == null) {
            return;
        }

        sessions.remove(session);
        if (sessions.isEmpty()) {
            userSessions.remove(resolvedUserId);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // This websocket is server-push only for now.
    }

    public void sendToUser(Long userId, MessagingRealtimeEvent event) {
        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        try {
            String payload = objectMapper.writeValueAsString(event);
            TextMessage message = new TextMessage(payload);
            sessions.removeIf(session -> !sendSafely(session, message));
            if (sessions.isEmpty()) {
                userSessions.remove(userId);
            }
        } catch (IOException ignored) {
            // Ignore serialization/socket issues in best-effort realtime delivery.
        }
    }

    private boolean sendSafely(WebSocketSession session, TextMessage message) {
        if (!session.isOpen()) {
            return false;
        }

        // sendMessage is NOT thread-safe; synchronize per session to prevent
        // "TEXT_PARTIAL_WRITING" errors when concurrent events target the same socket.
        synchronized (session) {
            if (!session.isOpen()) {
                return false;
            }
            try {
                session.sendMessage(message);
                return true;
            } catch (IOException ex) {
                return false;
            }
        }
    }

    private Long authenticate(URI uri) {
        if (uri == null || uri.getQuery() == null) {
            return null;
        }

        String token = null;
        for (String pair : uri.getQuery().split("&")) {
            String[] parts = pair.split("=", 2);
            if (parts.length == 2 && "token".equals(parts[0])) {
                token = parts[1];
                break;
            }
        }

        if (token == null || !jwtService.validateToken(token)) {
            return null;
        }

        return jwtService.extractUserId(token);
    }
}
