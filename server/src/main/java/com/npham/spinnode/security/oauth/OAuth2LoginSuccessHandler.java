package com.npham.spinnode.security.oauth;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.npham.spinnode.modules.auth.service.OAuth2LoginService;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.security.jwt.JwtService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final OAuth2LoginService oAuth2LoginService;
    private final JwtService jwtService;

    // Hardcoded frontend URL (must match your primary Vercel domain)
    private static final String FRONTEND_URL = "https://www.spin-node.com";

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        User user = oAuth2LoginService.processGoogleUser(oauth2User);

        String token = jwtService.generateAccessToken(user.getId());

        String redirectUrl = FRONTEND_URL + "/auth/callback?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }
}
