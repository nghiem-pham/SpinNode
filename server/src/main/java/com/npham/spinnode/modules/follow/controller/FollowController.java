package com.npham.spinnode.modules.follow.controller;

import java.security.Principal;

import org.springframework.web.bind.annotation.*;

import com.npham.spinnode.modules.follow.dto.response.FollowResponse;
import com.npham.spinnode.modules.follow.service.FollowService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{userId}/follow")
    public FollowResponse toggleFollow(Principal principal, @PathVariable Long userId) {
        return followService.toggleFollow(principal.getName(), userId);
    }
}
