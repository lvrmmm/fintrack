package com.fintrack.backend.controller;

import com.fintrack.backend.dto.request.ChangeEmailRequest;
import com.fintrack.backend.dto.request.ChangePasswordRequest;
import com.fintrack.backend.model.User;
import com.fintrack.backend.repository.UserRepository;
import com.fintrack.backend.security.JwtTokenProvider;
import com.fintrack.backend.security.auth.AuthRequest;
import com.fintrack.backend.security.auth.AuthResponse;
import com.fintrack.backend.security.auth.UserRegistrationDto;
import com.fintrack.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getUserIdFromToken(String token) {
        String jwt = token.substring(7); // Удаляем "Bearer "
        return jwtTokenProvider.getUserIdFromToken(jwt);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody UserRegistrationDto dto) {
        User user = authService.registerUser(dto);
        String token = jwtTokenProvider.generateToken(user.getUsername());
        return ResponseEntity.ok(
                AuthResponse.builder()
                        .username(user.getUsername())
                        .token(token)
                        .build()
        );
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest dto) {
        User user = authService.authenticate(dto.getUsername(), dto.getPassword());
        String token = jwtTokenProvider.generateToken(user.getUsername());
        return ResponseEntity.ok(
                AuthResponse.builder()
                        .username(user.getUsername())
                        .token(token)
                        .build()
        );
    }
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // В будущем можно добавить логику инвалидации токена
        return ResponseEntity.ok().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @RequestHeader("Authorization") String token,
            @RequestBody ChangePasswordRequest request) {
        Long userId = getUserIdFromToken(token);
        authService.changePassword(userId, request);
        return ResponseEntity.ok().build();
    }
    @PostMapping("/change-email")
    public ResponseEntity<Void> changeEmail(
            @RequestHeader("Authorization") String token,
            @RequestBody ChangeEmailRequest request) {
        Long userId = getUserIdFromToken(token);
        authService.changeEmail(userId, request);
        return ResponseEntity.ok().build();
    }
}