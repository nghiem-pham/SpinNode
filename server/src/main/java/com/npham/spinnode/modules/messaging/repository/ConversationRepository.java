package com.npham.spinnode.modules.messaging.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.messaging.entity.Conversation;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
}
