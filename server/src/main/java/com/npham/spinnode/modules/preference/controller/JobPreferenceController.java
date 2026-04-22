package com.npham.spinnode.modules.preference.controller;

import java.security.Principal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.npham.spinnode.modules.preference.dto.request.SavePreferencesRequest;
import com.npham.spinnode.modules.preference.dto.response.PreferencesResponse;
import com.npham.spinnode.modules.preference.service.JobPreferenceService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/me/preferences")
@RequiredArgsConstructor
public class JobPreferenceController {

    private final JobPreferenceService jobPreferenceService;

    @GetMapping
    public PreferencesResponse getPreferences(Principal principal) {
        return jobPreferenceService.getPreferences(principal.getName());
    }

    @PostMapping
    public PreferencesResponse savePreferences(
            Principal principal,
            @Valid @RequestBody SavePreferencesRequest req
    ) {
        return jobPreferenceService.savePreferences(principal.getName(), req);
    }
}
