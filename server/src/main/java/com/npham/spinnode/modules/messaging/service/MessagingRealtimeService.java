package com.npham.spinnode.modules.messaging.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.npham.spinnode.modules.messaging.dto.response.ConversationResponse;
import com.npham.spinnode.modules.messaging.dto.response.MessagingRealtimeEvent;
import com.npham.spinnode.modules.messaging.entity.ConversationParticipant;
import com.npham.spinnode.modules.messaging.websocket.MessagingWebSocketHandler;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MessagingRealtimeService {

    private final MessagingWebSocketHandler messagingWebSocketHandler;

    public void broadcastConversationUpdate(
            String type,
            List<ConversationParticipant> participants,
            java.util.function.Function<Long, ConversationResponse> responseFactory
    ) {
        for (ConversationParticipant participant : participants) {
            Long userId = participant.getUser().getId();
            messagingWebSocketHandler.sendToUser(
                    userId,
                    new MessagingRealtimeEvent(type, responseFactory.apply(userId))
            );
        }
    }
}
