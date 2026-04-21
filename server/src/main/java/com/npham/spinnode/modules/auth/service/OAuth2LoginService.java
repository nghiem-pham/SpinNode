package com.npham.spinnode.modules.auth.service;

import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.entity.UserRole;
import com.npham.spinnode.modules.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OAuth2LoginService {

    private final UserRepository userRepository;

    public User processGoogleUser(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        String displayName = oauth2User.getAttribute("name");

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email not found from Google");
        }

        if (displayName == null || displayName.isBlank()) {
            displayName = email.split("@")[0];
        }

        String normalizedEmail = email.trim().toLowerCase();

        String finalDisplayName = displayName;

        return userRepository.findByEmail(normalizedEmail)
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .email(normalizedEmail)
                                .displayName(finalDisplayName.trim())
                                .passwordHash("")
                                .role(UserRole.JOB_SEEKER)
                                .build()
                ));
    }
}
