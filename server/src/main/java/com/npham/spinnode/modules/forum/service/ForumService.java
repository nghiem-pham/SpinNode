package com.npham.spinnode.modules.forum.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.npham.spinnode.modules.forum.dto.request.CreateForumThreadRequest;
import com.npham.spinnode.modules.forum.dto.request.CreateReplyRequest;
import com.npham.spinnode.modules.forum.dto.response.ForumCategoryResponse;
import com.npham.spinnode.modules.forum.dto.response.ForumReplyResponse;
import com.npham.spinnode.modules.forum.dto.response.ForumThreadResponse;
import com.npham.spinnode.modules.forum.entity.ForumCategory;
import com.npham.spinnode.modules.forum.entity.ForumReply;
import com.npham.spinnode.modules.forum.entity.ForumThread;
import com.npham.spinnode.modules.forum.entity.ThreadUpvote;
import com.npham.spinnode.modules.forum.repository.ForumCategoryRepository;
import com.npham.spinnode.modules.forum.repository.ForumReplyRepository;
import com.npham.spinnode.modules.forum.repository.ForumThreadRepository;
import com.npham.spinnode.modules.forum.repository.ThreadUpvoteRepository;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.service.UserService;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class ForumService {

    private final ForumCategoryRepository categoryRepository;
    private final ForumThreadRepository threadRepository;
    private final ForumReplyRepository replyRepository;
    private final ThreadUpvoteRepository threadUpvoteRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<ForumCategoryResponse> getCategories() {
        return categoryRepository.findAll().stream()
                .map(category -> new ForumCategoryResponse(
                        category.getId(),
                        category.getSlug(),
                        category.getName(),
                        category.getDescription(),
                        category.getIcon(),
                        category.getTopicsCount(),
                        category.getPostsCount(),
                        category.getColor()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ForumThreadResponse> getThreads(String categorySlug, String searchQuery, String sortBy) {
        List<ForumThread> threads = (categorySlug == null || categorySlug.isBlank())
                ? threadRepository.findAllByOrderByIsPinnedDescLastActivityAtDesc()
                : threadRepository.findByCategory_SlugOrderByIsPinnedDescLastActivityAtDesc(categorySlug);

        return threads.stream()
                .filter(thread -> matchesSearch(thread, searchQuery))
                .sorted(comparatorFor(sortBy))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ForumThreadResponse createThread(String email, CreateForumThreadRequest request) {
        User author = userService.getRequiredByEmail(email);
        ForumCategory category = categoryRepository.findBySlug(request.categorySlug())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Category not found"));

        ForumThread thread = threadRepository.save(ForumThread.builder()
                .author(author)
                .category(category)
                .title(request.title())
                .content(request.content())
                .replies(0)
                .views(0)
                .upvotes(0)
                .isPinned(false)
                .isLocked(false)
                .createdAt(Instant.now())
                .lastActivityAt(Instant.now())
                .tags(String.join(",", request.tags()))
                .build());

        category.setTopicsCount(category.getTopicsCount() + 1);
        category.setPostsCount(category.getPostsCount() + 1);
        categoryRepository.save(category);

        return toResponse(thread);
    }

    @Transactional
    public void deleteThread(String email, Long threadId) {
        User user = userService.getRequiredByEmail(email);
        ForumThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Thread not found"));
        if (!thread.getAuthor().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only delete your own threads");
        }
        ForumCategory category = thread.getCategory();
        category.setTopicsCount(Math.max(0, category.getTopicsCount() - 1));
        category.setPostsCount(Math.max(0, category.getPostsCount() - 1));
        categoryRepository.save(category);
        threadRepository.delete(thread);
    }

    @Transactional
    public ForumThreadResponse toggleUpvote(String email, Long threadId) {
        User user = userService.getRequiredByEmail(email);
        ForumThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Thread not found"));

        java.util.Optional<ThreadUpvote> existing = threadUpvoteRepository.findByThread_IdAndUser_Id(threadId, user.getId());
        if (existing.isPresent()) {
            threadUpvoteRepository.delete(existing.get());
            thread.setUpvotes(Math.max(0, thread.getUpvotes() - 1));
        } else {
            threadUpvoteRepository.save(ThreadUpvote.builder()
                    .thread(thread)
                    .user(user)
                    .build());
            thread.setUpvotes(thread.getUpvotes() + 1);
        }
        threadRepository.save(thread);
        return toResponse(thread);
    }

    /** Fetch a single thread and bump its view counter. */
    @Transactional
    public ForumThreadResponse getThread(Long threadId) {
        ForumThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Thread not found"));
        thread.setViews(thread.getViews() + 1);
        threadRepository.save(thread);
        return toResponse(thread);
    }

    /** Fetch all replies for a thread, oldest first. */
    @Transactional(readOnly = true)
    public List<ForumReplyResponse> getReplies(Long threadId) {
        if (!threadRepository.existsById(threadId)) {
            throw new ResponseStatusException(NOT_FOUND, "Thread not found");
        }
        return replyRepository.findByThread_IdOrderByCreatedAtAsc(threadId).stream()
                .map(this::toReplyResponse)
                .toList();
    }

    /** Post a new reply and bump the thread's reply counter + last-activity. */
    @Transactional
    public ForumReplyResponse createReply(String email, Long threadId, CreateReplyRequest req) {
        User author = userService.getRequiredByEmail(email);
        ForumThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Thread not found"));
        if (thread.getIsLocked()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "Thread is locked");
        }

        ForumReply reply = replyRepository.save(ForumReply.builder()
                .thread(thread)
                .author(author)
                .content(req.content())
                .upvotes(0)
                .createdAt(Instant.now())
                .build());

        thread.setReplies(thread.getReplies() + 1);
        thread.setLastActivityAt(Instant.now());
        threadRepository.save(thread);

        return toReplyResponse(reply);
    }

    @Transactional(readOnly = true)
    public List<ForumThreadResponse> getThreadsByUser(Long userId) {
        return threadRepository.findByAuthor_IdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ForumReplyResponse> getRepliesByUser(Long userId) {
        return replyRepository.findByAuthor_IdOrderByCreatedAtDesc(userId).stream()
                .map(this::toReplyResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ForumThreadResponse> getLikedThreadsByUser(Long userId) {
        return threadUpvoteRepository.findByUser_IdOrderByIdDesc(userId).stream()
                .map(upvote -> toResponse(upvote.getThread())).toList();
    }

    private boolean matchesSearch(ForumThread thread, String searchQuery) {
        if (searchQuery == null || searchQuery.isBlank()) {
            return true;
        }
        String normalized = searchQuery.toLowerCase();
        return thread.getTitle().toLowerCase().contains(normalized)
                || thread.getContent().toLowerCase().contains(normalized)
                || thread.getTags().toLowerCase().contains(normalized);
    }

    private Comparator<ForumThread> comparatorFor(String sortBy) {
        Comparator<ForumThread> pinnedFirst = Comparator.comparing(ForumThread::getIsPinned).reversed();
        Comparator<ForumThread> byRecent = Comparator.comparing(ForumThread::getLastActivityAt).reversed();
        Comparator<ForumThread> byPopular = Comparator.comparing(ForumThread::getUpvotes).reversed();
        Comparator<ForumThread> byTrending = Comparator.comparing(ForumThread::getViews).reversed();
        return switch (sortBy == null ? "recent" : sortBy) {
            case "popular" -> pinnedFirst.thenComparing(byPopular);
            case "trending" -> pinnedFirst.thenComparing(byTrending);
            default -> pinnedFirst.thenComparing(byRecent);
        };
    }

    private ForumThreadResponse toResponse(ForumThread thread) {
        String avatar = userService.defaultAvatar(thread.getAuthor().getEmail());
        return new ForumThreadResponse(
                thread.getId(),
                thread.getTitle(),
                new ForumThreadResponse.AuthorSummary(thread.getAuthor().getId(), thread.getAuthor().getDisplayName(), avatar),
                thread.getCategory().getSlug(),
                thread.getContent(),
                thread.getReplies(),
                thread.getViews(),
                thread.getUpvotes(),
                thread.getIsPinned(),
                thread.getIsLocked(),
                thread.getCreatedAt(),
                thread.getLastActivityAt(),
                List.of(thread.getTags().split(","))
        );
    }

    private ForumReplyResponse toReplyResponse(ForumReply reply) {
        String avatar = userService.defaultAvatar(reply.getAuthor().getEmail());
        return new ForumReplyResponse(
                reply.getId(),
                new ForumReplyResponse.AuthorSummary(reply.getAuthor().getId(), reply.getAuthor().getDisplayName(), avatar),
                reply.getContent(),
                reply.getUpvotes(),
                reply.getCreatedAt(),
                reply.getThread().getId()
        );
    }
}
