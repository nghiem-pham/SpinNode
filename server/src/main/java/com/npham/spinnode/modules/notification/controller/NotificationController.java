package com.npham.spinnode.modules.notification.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.npham.spinnode.modules.notification.dto.response.NotificationResponse;
import com.npham.spinnode.modules.notification.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> getNotifications(
            Principal principal,
            @RequestParam(defaultValue = "false") boolean unreadOnly
    ) {
        return notificationService.getNotifications(principal.getName(), unreadOnly);
    }

    @PatchMapping("/{notificationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAsRead(Principal principal, @PathVariable Long notificationId) {
        notificationService.markAsRead(principal.getName(), notificationId);
    }

    @PatchMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllAsRead(Principal principal) {
        notificationService.markAllAsRead(principal.getName());
    }
}
