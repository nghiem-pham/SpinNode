package com.npham.spinnode.modules.notification.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.npham.spinnode.modules.notification.dto.response.NotificationResponse;
import com.npham.spinnode.modules.notification.entity.Notification;
import com.npham.spinnode.modules.notification.repository.NotificationRepository;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.service.UserService;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(String email, boolean unreadOnly) {
        User user = userService.getRequiredByEmail(email);
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(notification -> !unreadOnly || notification.getReadAt() == null)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void markAsRead(String email, Long notificationId) {
        User user = userService.getRequiredByEmail(email);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Notification not found"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(NOT_FOUND, "Notification not found");
        }
        notification.setReadAt(Instant.now());
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String email) {
        User user = userService.getRequiredByEmail(email);
        notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).forEach(notification -> {
            if (notification.getReadAt() == null) {
                notification.setReadAt(Instant.now());
                notificationRepository.save(notification);
            }
        });
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                new NotificationResponse.ActorSummary(
                        notification.getActor().getId(),
                        notification.getActor().getDisplayName(),
                        userService.defaultAvatar(notification.getActor().getEmail())
                ),
                notification.getContent(),
                notification.getPostContent(),
                notification.getCreatedAt(),
                notification.getReadAt() != null
        );
    }
}
