package com.npham.spinnode.modules.user.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.npham.spinnode.modules.user.dto.request.ChangePasswordRequest;
import com.npham.spinnode.modules.user.dto.response.UserResponse;
import com.npham.spinnode.modules.profile.entity.UserProfile;
import com.npham.spinnode.modules.profile.repository.UserProfileRepository;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.entity.UserRole;
import com.npham.spinnode.modules.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserProfileRepository userProfileRepository;

    public Optional<User> getByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase());
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email.trim().toLowerCase());
    }

    @Transactional
    public User createUser(String email, String rawPassword, String displayName, UserRole role) {
        User user = User.builder()
                .email(email.trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .displayName(displayName)
                .role(role)
                .build();

        User savedUser = userRepository.save(user);
        userProfileRepository.save(UserProfile.builder()
                .user(savedUser)
                .bio("")
                .location("")
                .avatarUrl(defaultAvatar(savedUser.getEmail()))
                .coverUrl(null)
                .build());
        return savedUser;
    }

    public UserResponse getMe(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return toResponse(user);
    }

    public void changePassword(String email, ChangePasswordRequest req) {
        User user = getRequiredByEmail(email);

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Current password incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    public User getRequiredByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
    }

    public User getRequiredById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> searchUsers(String query) {
        return userRepository.findByDisplayNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query);
    }

    public String avatarFor(User user) {
        return userProfileRepository.findByUser_Id(user.getId())
                .map(UserProfile::getAvatarUrl)
                .filter(UserService::isUploadedAvatar)
                .orElse(null);
    }

    /** Returns true only for user-uploaded images (base64 data URLs). */
    public static boolean isUploadedAvatar(String url) {
        return url != null && url.startsWith("data:");
    }

    public String defaultAvatar(String seed) {
        return "https://ui-avatars.com/api/?name=" + seed
                + "&background=0e8f8f&color=fff&bold=true&rounded=true&size=128";
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
