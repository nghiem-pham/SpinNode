package com.npham.spinnode.modules.post.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.npham.spinnode.modules.post.dto.request.CreatePostRequest;
import com.npham.spinnode.modules.post.dto.response.PostResponse;
import com.npham.spinnode.modules.post.service.PostService;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;
    private final UserService userService;

    @GetMapping
    public List<PostResponse> getAllPosts(Principal principal) {
        Long currentUserId = resolveUserId(principal);
        return postService.getAllPosts(currentUserId);
    }

    @GetMapping("/{postId}")
    public PostResponse getById(@PathVariable Long postId, Principal principal) {
        Long currentUserId = resolveUserId(principal);
        return postService.getPostById(postId, currentUserId);
    }

    @GetMapping("/user/{userId}")
    public List<PostResponse> getByUserId(@PathVariable Long userId, Principal principal) {
        Long currentUserId = resolveUserId(principal);
        return postService.getPostsByUserId(userId, currentUserId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse createPost(Principal principal, @Valid @RequestBody CreatePostRequest request) {
        return postService.createPost(principal.getName(), request);
    }

    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(Principal principal, @PathVariable Long postId) {
        postService.deletePost(principal.getName(), postId);
    }

    @PostMapping("/{postId}/like")
    public PostResponse toggleLike(Principal principal, @PathVariable Long postId) {
        return postService.toggleLike(principal.getName(), postId);
    }

    @PostMapping("/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse addComment(Principal principal, @PathVariable Long postId, @RequestBody CommentRequest request) {
        return postService.addComment(principal.getName(), postId, request.content());
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(Principal principal, @PathVariable Long commentId) {
        postService.deleteComment(principal.getName(), commentId);
    }

    private Long resolveUserId(Principal principal) {
        if (principal == null) return null;
        User user = userService.getRequiredByEmail(principal.getName());
        return user.getId();
    }

    public record CommentRequest(String content) {}
}
