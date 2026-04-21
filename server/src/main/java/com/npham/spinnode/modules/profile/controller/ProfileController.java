package com.npham.spinnode.modules.profile.controller;

import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.npham.spinnode.modules.profile.dto.request.UpdateProfileRequest;
import com.npham.spinnode.modules.profile.dto.response.ProfileResponse;
import com.npham.spinnode.modules.profile.service.ProfileService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    public record UpdateVisibilityRequest(@NotNull Boolean profileVisible) {}

    @GetMapping
    public ProfileResponse getProfile(Principal principal) {
        return profileService.getProfile(principal.getName());
    }

    @GetMapping("/{userId}")
    public ProfileResponse getPublicProfile(@PathVariable Long userId) {
        return profileService.getProfileById(userId);
    }

    @PatchMapping
    public ProfileResponse updateProfile(Principal principal, @Valid @RequestBody UpdateProfileRequest request) {
        return profileService.updateProfile(principal.getName(), request);
    }

    @PatchMapping("/visibility")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateVisibility(Principal principal, @Valid @RequestBody UpdateVisibilityRequest request) {
        profileService.updateVisibility(principal.getName(), request.profileVisible());
    }
}
