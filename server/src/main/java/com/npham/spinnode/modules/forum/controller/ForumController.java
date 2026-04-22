package com.npham.spinnode.modules.forum.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.npham.spinnode.modules.forum.dto.request.CreateForumThreadRequest;
import com.npham.spinnode.modules.forum.dto.request.CreateReplyRequest;
import com.npham.spinnode.modules.forum.dto.response.ForumCategoryResponse;
import com.npham.spinnode.modules.forum.dto.response.ForumReplyResponse;
import com.npham.spinnode.modules.forum.dto.response.ForumThreadResponse;
import com.npham.spinnode.modules.forum.service.ForumService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/forums")
@RequiredArgsConstructor
public class ForumController {

    private final ForumService forumService;

    @GetMapping("/categories")
    public List<ForumCategoryResponse> getCategories() {
        return forumService.getCategories();
    }

    @GetMapping("/threads")
    public List<ForumThreadResponse> getThreads(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "recent") String sortBy
    ) {
        return forumService.getThreads(category, query, sortBy);
    }

    @PostMapping("/threads")
    public ForumThreadResponse createThread(Principal principal, @Valid @RequestBody CreateForumThreadRequest request) {
        return forumService.createThread(principal.getName(), request);
    }

    @DeleteMapping("/threads/{threadId}")
    public ResponseEntity<Void> deleteThread(Principal principal, @PathVariable Long threadId) {
        forumService.deleteThread(principal.getName(), threadId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/threads/{threadId}")
    public ForumThreadResponse getThread(@PathVariable Long threadId) {
        return forumService.getThread(threadId);
    }

    @GetMapping("/threads/{threadId}/replies")
    public List<ForumReplyResponse> getReplies(@PathVariable Long threadId) {
        return forumService.getReplies(threadId);
    }

    @PostMapping("/threads/{threadId}/replies")
    public ForumReplyResponse createReply(
            Principal principal,
            @PathVariable Long threadId,
            @Valid @RequestBody CreateReplyRequest request
    ) {
        return forumService.createReply(principal.getName(), threadId, request);
    }

    @DeleteMapping("/threads/{threadId}/replies/{replyId}")
    public ResponseEntity<Void> deleteReply(Principal principal, @PathVariable Long threadId, @PathVariable Long replyId) {
        forumService.deleteReply(principal.getName(), threadId, replyId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/threads/{threadId}/upvote")
    public ForumThreadResponse toggleUpvote(Principal principal, @PathVariable Long threadId) {
        return forumService.toggleUpvote(principal.getName(), threadId);
    }

    @GetMapping("/users/{userId}/threads")
    public List<ForumThreadResponse> getThreadsByUser(@PathVariable Long userId) {
        return forumService.getThreadsByUser(userId);
    }

    @GetMapping("/users/{userId}/replies")
    public List<ForumReplyResponse> getRepliesByUser(@PathVariable Long userId) {
        return forumService.getRepliesByUser(userId);
    }

    @GetMapping("/users/{userId}/liked-threads")
    public List<ForumThreadResponse> getLikedThreadsByUser(@PathVariable Long userId) {
        return forumService.getLikedThreadsByUser(userId);
    }
}
