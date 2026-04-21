package com.npham.spinnode.modules.messaging.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.npham.spinnode.modules.messaging.dto.request.CreateConversationRequest;
import com.npham.spinnode.modules.messaging.dto.request.SendMessageRequest;
import com.npham.spinnode.modules.messaging.dto.response.ConversationResponse;
import com.npham.spinnode.modules.messaging.dto.response.MessageResponse;
import com.npham.spinnode.modules.messaging.entity.Conversation;
import com.npham.spinnode.modules.messaging.entity.ConversationParticipant;
import com.npham.spinnode.modules.messaging.entity.Message;
import com.npham.spinnode.modules.messaging.repository.ConversationParticipantRepository;
import com.npham.spinnode.modules.messaging.repository.ConversationRepository;
import com.npham.spinnode.modules.messaging.repository.MessageRepository;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.service.UserService;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class MessagingService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final UserService userService;
    private final MessagingRealtimeService messagingRealtimeService;

    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(String email) {
        User currentUser = userService.getRequiredByEmail(email);
        return participantRepository.findByUser_Id(currentUser.getId()).stream()
                .sorted(Comparator.comparing((ConversationParticipant p) -> p.getConversation().getUpdatedAt()).reversed())
                .map(participant -> toConversationResponse(currentUser, participant.getConversation()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(String email, Long conversationId) {
        User currentUser = userService.getRequiredByEmail(email);
        requireParticipant(currentUser.getId(), conversationId);
        markAsRead(currentUser.getId(), conversationId);
        return messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversationId).stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional
    public ConversationResponse createConversation(String email, CreateConversationRequest request) {
        User currentUser = userService.getRequiredByEmail(email);
        if (currentUser.getId().equals(request.participantUserId())) {
            throw new ResponseStatusException(BAD_REQUEST, "Cannot start a conversation with yourself");
        }
        User participantUser = userService.getRequiredById(request.participantUserId());

        // Reuse existing 1-to-1 conversation if one already exists
        var existingConversation = participantRepository.findConversationBetween(
                currentUser.getId(), request.participantUserId());
        if (existingConversation.isPresent()) {
            Conversation conversation = existingConversation.get();
            List<ConversationParticipant> participants = participantRepository.findByConversation_Id(conversation.getId());

            // Send the new message into the existing conversation
            messageRepository.save(Message.builder()
                    .conversation(conversation)
                    .sender(currentUser)
                    .content(request.message())
                    .createdAt(Instant.now())
                    .build());
            conversation.setUpdatedAt(Instant.now());
            conversationRepository.save(conversation);

            messagingRealtimeService.broadcastConversationUpdate(
                    "message.sent",
                    participants,
                    userId -> toConversationResponse(userId, conversation, participants)
            );
            return toConversationResponse(currentUser.getId(), conversation, participants);
        }

        // No existing conversation — create a new one
        Conversation conversation = conversationRepository.save(Conversation.builder()
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        ConversationParticipant currentParticipant = participantRepository.save(ConversationParticipant.builder()
                .conversation(conversation)
                .user(currentUser)
                .lastReadAt(Instant.now())
                .build());
        ConversationParticipant otherParticipant = participantRepository.save(ConversationParticipant.builder()
                .conversation(conversation)
                .user(participantUser)
                .lastReadAt(null)
                .build());

        messageRepository.save(Message.builder()
                .conversation(conversation)
                .sender(currentUser)
                .content(request.message())
                .createdAt(Instant.now())
                .build());

        List<ConversationParticipant> participants = List.of(currentParticipant, otherParticipant);
        messagingRealtimeService.broadcastConversationUpdate(
                "conversation.created",
                participants,
                userId -> toConversationResponse(userId, conversation, participants)
        );
        return toConversationResponse(currentUser.getId(), conversation, participants);
    }

    @Transactional
    public MessageResponse sendMessage(String email, Long conversationId, SendMessageRequest request) {
        User currentUser = userService.getRequiredByEmail(email);
        Conversation conversation = requireParticipant(currentUser.getId(), conversationId).getConversation();
        Message message = messageRepository.save(Message.builder()
                .conversation(conversation)
                .sender(currentUser)
                .content(request.message())
                .createdAt(Instant.now())
                .build());

        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        participantRepository.findByConversation_Id(conversationId).stream()
                .filter(participant -> participant.getUser().getId().equals(currentUser.getId()))
                .findFirst()
                .ifPresent(participant -> {
                    participant.setLastReadAt(Instant.now());
                    participantRepository.save(participant);
                });

        List<ConversationParticipant> participants = participantRepository.findByConversation_Id(conversationId);
        messagingRealtimeService.broadcastConversationUpdate(
                "message.created",
                participants,
                userId -> toConversationResponse(userId, conversation, participants)
        );

        return toMessageResponse(message);
    }

    @Transactional
    public void markAsRead(String email, Long conversationId) {
        User currentUser = userService.getRequiredByEmail(email);
        markAsRead(currentUser.getId(), conversationId);
    }

    private void markAsRead(Long userId, Long conversationId) {
        ConversationParticipant participant = requireParticipant(userId, conversationId);
        participant.setLastReadAt(Instant.now());
        participantRepository.save(participant);

        List<ConversationParticipant> participants = participantRepository.findByConversation_Id(conversationId);
        messagingRealtimeService.broadcastConversationUpdate(
                "conversation.read",
                participants,
                currentUserId -> toConversationResponse(currentUserId, participant.getConversation(), participants)
        );
    }

    private ConversationParticipant requireParticipant(Long userId, Long conversationId) {
        return participantRepository.findByConversation_IdAndUser_Id(conversationId, userId)
                .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "You are not part of this conversation"));
    }

    private ConversationResponse toConversationResponse(User currentUser, Conversation conversation) {
        return toConversationResponse(currentUser.getId(), conversation, participantRepository.findByConversation_Id(conversation.getId()));
    }

    private ConversationResponse toConversationResponse(Long currentUserId, Conversation conversation, List<ConversationParticipant> participants) {
        ConversationParticipant currentParticipant = participants.stream()
                .filter(participant -> participant.getUser().getId().equals(currentUserId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Conversation not found"));
        User currentUser = currentParticipant.getUser();
        User otherUser = participants.stream()
                .map(ConversationParticipant::getUser)
                .filter(user -> !user.getId().equals(currentUserId))
                .findFirst()
                .orElse(currentUser);

        List<Message> conversationMessages = messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversation.getId());
        List<MessageResponse> messages = conversationMessages.stream()
                .map(this::toMessageResponse)
                .toList();
        Message lastMessage = conversationMessages.isEmpty() ? null : conversationMessages.get(conversationMessages.size() - 1);
        long unread = currentParticipant.getLastReadAt() == null
                ? conversationMessages.stream()
                    .filter(message -> !message.getSender().getId().equals(currentUserId))
                    .count()
                : conversationMessages.stream()
                    .filter(message -> !message.getSender().getId().equals(currentUserId))
                    .filter(message -> message.getCreatedAt().isAfter(currentParticipant.getLastReadAt()))
                    .count();

        return new ConversationResponse(
                conversation.getId(),
                otherUser.getId(),
                otherUser.getDisplayName(),
                userService.defaultAvatar(otherUser.getEmail()),
                lastMessage == null ? "" : lastMessage.getContent(),
                lastMessage == null ? conversation.getUpdatedAt() : lastMessage.getCreatedAt(),
                unread,
                true,
                messages
        );
    }

    private MessageResponse toMessageResponse(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getSender().getId(),
                message.getSender().getDisplayName(),
                userService.defaultAvatar(message.getSender().getEmail()),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
