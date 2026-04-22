package com.npham.spinnode.modules.profile.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.npham.spinnode.modules.profile.dto.request.UpdateProfileRequest;
import com.npham.spinnode.modules.profile.dto.response.ProfileResponse;
import com.npham.spinnode.modules.profile.entity.Experience;
import com.npham.spinnode.modules.profile.entity.ProfileProject;
import com.npham.spinnode.modules.profile.entity.UserProfile;
import com.npham.spinnode.modules.profile.entity.UserSkill;
import com.npham.spinnode.modules.profile.repository.ExperienceRepository;
import com.npham.spinnode.modules.profile.repository.ProfileProjectRepository;
import com.npham.spinnode.modules.profile.repository.UserProfileRepository;
import com.npham.spinnode.modules.profile.repository.UserSkillRepository;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.repository.UserRepository;
import com.npham.spinnode.modules.user.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ExperienceRepository experienceRepository;
    private final ProfileProjectRepository projectRepository;
    private final UserSkillRepository userSkillRepository;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String email) {
        User user = userService.getRequiredByEmail(email);
        UserProfile profile = getOrCreateProfile(user);
        return toResponse(user, profile);
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfileById(Long userId) {
        User user = userService.getRequiredById(userId);
        UserProfile profile = getOrCreateProfile(user);
        if (!profile.isProfileVisible()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This profile is private");
        }
        return toResponse(user, profile);
    }

    @Transactional
    public void updateVisibility(String email, boolean profileVisible) {
        User user = userService.getRequiredByEmail(email);
        UserProfile profile = getOrCreateProfile(user);
        profile.setProfileVisible(profileVisible);
        userProfileRepository.save(profile);
    }

    @Transactional
    public ProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userService.getRequiredByEmail(email);
        user.setDisplayName(request.name().trim());
        userRepository.save(user);

        UserProfile profile = getOrCreateProfile(user);
        profile.setBio(request.bio());
        profile.setLocation(request.location());
        profile.setAvatarUrl(request.avatarUrl());
        profile.setCoverUrl(request.coverUrl());
        userProfileRepository.save(profile);

        experienceRepository.deleteByProfile_UserId(user.getId());
        projectRepository.deleteByProfile_UserId(user.getId());
        userSkillRepository.deleteByProfile_UserId(user.getId());

        List<UpdateProfileRequest.ExperienceItem> experiences = request.experiences() == null ? List.of() : request.experiences();
        List<UpdateProfileRequest.ProjectItem> projects = request.projects() == null ? List.of() : request.projects();
        List<UpdateProfileRequest.SkillItem> skills = request.skills() == null ? List.of() : request.skills();

        for (int i = 0; i < experiences.size(); i++) {
            UpdateProfileRequest.ExperienceItem item = experiences.get(i);
            experienceRepository.save(Experience.builder()
                    .profile(profile)
                    .title(item.title())
                    .company(item.company())
                    .duration(item.duration())
                    .description(item.description())
                    .displayOrder(i)
                    .build());
        }

        for (int i = 0; i < projects.size(); i++) {
            UpdateProfileRequest.ProjectItem item = projects.get(i);
            projectRepository.save(ProfileProject.builder()
                    .profile(profile)
                    .name(item.name())
                    .description(item.description())
                    .technologies(String.join(",", item.technologies()))
                    .link(item.link())
                    .displayOrder(i)
                    .build());
        }

        for (int i = 0; i < skills.size(); i++) {
            UpdateProfileRequest.SkillItem item = skills.get(i);
            userSkillRepository.save(UserSkill.builder()
                    .profile(profile)
                    .name(item.name())
                    .level(item.level())
                    .displayOrder(i)
                    .build());
        }

        return toResponse(user, profile);
    }

    private UserProfile getOrCreateProfile(User user) {
        return userProfileRepository.findByUser_Id(user.getId())
                .orElseGet(() -> userProfileRepository.save(UserProfile.builder()
                        .user(user)
                        .bio("")
                        .location("")
                        .avatarUrl(userService.defaultAvatar(user.getEmail()))
                        .coverUrl(null)
                        .build()));
    }

    private ProfileResponse toResponse(User user, UserProfile profile) {
        List<ProfileResponse.ExperienceItem> experiences = experienceRepository.findByProfile_UserIdOrderByDisplayOrderAscIdAsc(user.getId())
                .stream()
                .map(item -> new ProfileResponse.ExperienceItem(item.getId(), item.getTitle(), item.getCompany(), item.getDuration(), item.getDescription()))
                .toList();
        List<ProfileResponse.ProjectItem> projects = projectRepository.findByProfile_UserIdOrderByDisplayOrderAscIdAsc(user.getId())
                .stream()
                .map(item -> new ProfileResponse.ProjectItem(item.getId(), item.getName(), item.getDescription(), splitCsv(item.getTechnologies()), item.getLink()))
                .toList();
        List<ProfileResponse.SkillItem> skills = userSkillRepository.findByProfile_UserIdOrderByDisplayOrderAscIdAsc(user.getId())
                .stream()
                .map(item -> new ProfileResponse.SkillItem(item.getId(), item.getName(), item.getLevel()))
                .toList();

        return new ProfileResponse(
                user.getId(),
                user.getDisplayName(),
                user.getEmail(),
                profile.getBio(),
                profile.getLocation(),
                UserService.isUploadedAvatar(profile.getAvatarUrl()) ? profile.getAvatarUrl() : null,
                profile.getCoverUrl(),
                user.getCreatedAt(),
                experiences,
                projects,
                skills,
                profile.isProfileVisible()
        );
    }

    private List<String> splitCsv(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return List.of(value.split(","));
    }
}
