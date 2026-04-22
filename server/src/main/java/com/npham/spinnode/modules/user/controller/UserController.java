package com.npham.spinnode.modules.user.controller;

import java.security.Principal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.npham.spinnode.modules.follow.service.FollowService;
import com.npham.spinnode.modules.user.dto.request.ChangePasswordRequest;
import com.npham.spinnode.modules.user.dto.response.UserResponse;
import com.npham.spinnode.modules.user.dto.response.UserSummaryResponse;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    private final UserService userService;
    private final FollowService followService;

    // Get info
    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        if (authentication == null) {
            log.error("/api/me called with null authentication");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        log.info("/api/me called for user: {}", authentication.getName());
        try {
            return userService.getMe(authentication.getName());
        } catch (Exception e) {
            log.error("/api/me failed for user {}: {}", authentication.getName(), e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    // Change password
    @PatchMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest req
    ) {
        String email = authentication.getName();
        userService.changePassword(email, req);
    }

    // List / search users
    @GetMapping("/users")
    public List<UserSummaryResponse> getUsers(
            Principal principal,
            @RequestParam(required = false) String query
    ) {
        User currentUser = userService.getRequiredByEmail(principal.getName());

        List<User> users = (query == null || query.isBlank())
                ? userService.getAllUsers()
                : userService.searchUsers(query);

        return users.stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .map(u -> new UserSummaryResponse(
                        u.getId(),
                        u.getDisplayName(),
                        u.getRole().name(),
                        userService.avatarFor(u),
                        followService.getFollowersCount(u.getId()),
                        followService.isFollowing(currentUser.getId(), u.getId())
                ))
                .toList();
    }
}
