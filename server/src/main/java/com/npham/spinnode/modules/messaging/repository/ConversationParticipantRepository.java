package com.npham.spinnode.modules.messaging.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.npham.spinnode.modules.messaging.entity.ConversationParticipant;

public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, Long> {

    List<ConversationParticipant> findByUser_Id(Long userId);

    List<ConversationParticipant> findByConversation_Id(Long conversationId);

    Optional<ConversationParticipant> findByConversation_IdAndUser_Id(Long conversationId, Long userId);

    /** Returns the conversation shared exclusively by exactly these two users, if one exists. */
    @Query("""
        SELECT cp1.conversation FROM ConversationParticipant cp1
        JOIN ConversationParticipant cp2 ON cp2.conversation = cp1.conversation
        WHERE cp1.user.id = :userId1 AND cp2.user.id = :userId2
        AND (SELECT COUNT(cp3) FROM ConversationParticipant cp3 WHERE cp3.conversation = cp1.conversation) = 2
        """)
    Optional<com.npham.spinnode.modules.messaging.entity.Conversation> findConversationBetween(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2
    );
}
