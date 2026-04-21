package com.npham.spinnode.modules.auth.service;

import java.util.Optional;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

import com.npham.spinnode.modules.auth.dto.request.LoginRequest;
import com.npham.spinnode.modules.auth.dto.request.RegisterRequest;
import com.npham.spinnode.modules.auth.dto.response.AuthResponse;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.entity.UserRole;
import com.npham.spinnode.modules.user.service.UserService;
import com.npham.spinnode.security.jwt.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public void register(RegisterRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        String password = req.getPassword();
        String displayName = req.getDisplayName();
        UserRole role = req.getRole();

        if (userService.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already taken");
        }

        userService.createUser(email, password, displayName, role);
    }

    public AuthResponse login(LoginRequest req) {
        String input = req.getEmail().trim();
        String password = req.getPassword();

        User user = resolveUser(input)
            .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), password));
        } catch (BadCredentialsException ex) {
            throw new IllegalArgumentException("Invalid credentials");
        } catch (AuthenticationException ex) {
            throw new IllegalStateException("Authentication failed");
        }
        
        String token = jwtService.generateAccessToken(user.getId());
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .role(user.getRole())
                .build();
    }

    private Optional<User> resolveUser(String email) {
        email = (email == null) ? "" : email.trim();
        return userService.getByEmail(email.toLowerCase());

    }
}
