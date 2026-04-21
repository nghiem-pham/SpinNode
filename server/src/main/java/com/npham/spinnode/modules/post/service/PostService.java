package com.npham.spinnode.modules.post.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.npham.spinnode.modules.post.dto.request.CreatePostRequest;
import com.npham.spinnode.modules.post.dto.response.PostResponse;
import com.npham.spinnode.modules.post.entity.Post;
import com.npham.spinnode.modules.post.entity.PostComment;
import com.npham.spinnode.modules.post.entity.PostLike;
import com.npham.spinnode.modules.post.repository.PostCommentRepository;
import com.npham.spinnode.modules.post.repository.PostLikeRepository;
import com.npham.spinnode.modules.post.repository.PostRepository;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.service.UserService;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final UserService userService;

    @Transactional
    public PostResponse createPost(String email, CreatePostRequest request) {
        User user = userService.getRequiredByEmail(email);

        Post post = Post.builder()
                .content(request.getContent().trim())
                .imageUrl(request.getImageUrl())
                .createdAt(Instant.now())
                .user(user)
                .build();

        post = postRepository.save(post);
        return toResponse(post, user.getId());
    }

    @Transactional
    public void deletePost(String email, Long postId) {
        User user = userService.getRequiredByEmail(email);
        Post post = getById(postId);

        if (!post.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only delete your own posts");
        }

        postRepository.delete(post);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getAllPosts(Long currentUserId) {
        return postRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(post -> toResponse(post, currentUserId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getPostsByUserId(Long userId, Long currentUserId) {
        return postRepository.findByUser_IdOrderByCreatedAtDesc(userId).stream()
                .map(post -> toResponse(post, currentUserId))
                .toList();
    }

    @Transactional(readOnly = true)
    public PostResponse getPostById(Long postId, Long currentUserId) {
        Post post = getById(postId);
        return toResponse(post, currentUserId);
    }

    // --- Likes ---

    @Transactional
    public PostResponse toggleLike(String email, Long postId) {
        User user = userService.getRequiredByEmail(email);
        Post post = getById(postId);

        Optional<PostLike> existing = postLikeRepository.findByPost_IdAndUser_Id(postId, user.getId());
        if (existing.isPresent()) {
            postLikeRepository.delete(existing.get());
        } else {
            postLikeRepository.save(PostLike.builder()
                    .post(post)
                    .user(user)
                    .build());
        }

        return toResponse(post, user.getId());
    }

    // --- Comments ---

    @Transactional
    public PostResponse addComment(String email, Long postId, String content) {
        User user = userService.getRequiredByEmail(email);
        Post post = getById(postId);

        postCommentRepository.save(PostComment.builder()
                .post(post)
                .user(user)
                .content(content.trim())
                .build());

        return toResponse(post, user.getId());
    }

    @Transactional
    public void deleteComment(String email, Long commentId) {
        User user = userService.getRequiredByEmail(email);
        PostComment comment = postCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Comment not found"));

        if (!comment.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only delete your own comments");
        }

        postCommentRepository.delete(comment);
    }

    // --- Internal helpers ---

    public Post getById(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Post not found"));
    }

    public List<Post> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Post> getPostsByUserId(Long userId) {
        return postRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    private PostResponse toResponse(Post post, Long currentUserId) {
        User author = post.getUser();
        return PostResponse.builder()
                .id(post.getId())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .createdAt(post.getCreatedAt())
                .authorId(author.getId())
                .authorEmail(author.getEmail())
                .authorDisplayName(author.getDisplayName())
                .authorAvatar(userService.defaultAvatar(author.getEmail()))
                .likesCount(postLikeRepository.countByPost_Id(post.getId()))
                .commentsCount(postCommentRepository.countByPost_Id(post.getId()))
                .likedByMe(currentUserId != null && postLikeRepository.existsByPost_IdAndUser_Id(post.getId(), currentUserId))
                .build();
    }
}
