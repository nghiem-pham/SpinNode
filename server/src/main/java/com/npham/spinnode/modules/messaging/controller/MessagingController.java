package com.npham.spinnode.modules.messaging.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.npham.spinnode.modules.messaging.dto.request.CreateConversationRequest;
import com.npham.spinnode.modules.messaging.dto.request.SendMessageRequest;
import com.npham.spinnode.modules.messaging.dto.response.ConversationResponse;
import com.npham.spinnode.modules.messaging.dto.response.MessageResponse;
import com.npham.spinnode.modules.messaging.service.MessagingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessagingController {

    private final MessagingService messagingService;

    @GetMapping("/conversations")
    public List<ConversationResponse> getConversations(Principal principal) {
        return messagingService.getConversations(principal.getName());
    }

    @PostMapping("/conversations")
    public ConversationResponse createConversation(Principal principal, @Valid @RequestBody CreateConversationRequest request) {
        return messagingService.createConversation(principal.getName(), request);
    }

    @GetMapping("/conversations/{conversationId}")
    public List<MessageResponse> getMessages(Principal principal, @PathVariable Long conversationId) {
        return messagingService.getMessages(principal.getName(), conversationId);
    }

    @PostMapping("/conversations/{conversationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAsRead(Principal principal, @PathVariable Long conversationId) {
        messagingService.markAsRead(principal.getName(), conversationId);
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public MessageResponse sendMessage(
            Principal principal,
            @PathVariable Long conversationId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        return messagingService.sendMessage(principal.getName(), conversationId, request);
    }
}
