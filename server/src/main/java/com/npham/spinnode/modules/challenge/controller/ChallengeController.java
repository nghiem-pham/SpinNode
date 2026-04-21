package com.npham.spinnode.modules.challenge.controller;

import java.security.Principal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.npham.spinnode.modules.challenge.dto.response.ChallengeOverviewResponse;
import com.npham.spinnode.modules.challenge.dto.response.ChallengeResponse;
import com.npham.spinnode.modules.challenge.service.ChallengeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    @GetMapping
    public ChallengeOverviewResponse getOverview(Principal principal) {
        return challengeService.getOverview(principal.getName());
    }

    @PostMapping("/daily/complete")
    public ChallengeResponse completeDailyChallenge(Principal principal) {
        return challengeService.completeDailyChallenge(principal.getName());
    }
}
