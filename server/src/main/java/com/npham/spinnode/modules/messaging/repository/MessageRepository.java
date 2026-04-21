package com.npham.spinnode.modules.messaging.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.messaging.entity.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversation_IdOrderByCreatedAtAsc(Long conversationId);

    Message findTopByConversation_IdOrderByCreatedAtDesc(Long conversationId);

    long countByConversation_IdAndCreatedAtAfter(Long conversationId, java.time.Instant createdAt);
}
