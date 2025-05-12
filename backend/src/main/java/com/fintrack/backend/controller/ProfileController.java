package com.fintrack.backend.controller;


import com.fintrack.backend.dto.UserProfileDto;
import com.fintrack.backend.dto.response.UserProfileResponseDto;
import com.fintrack.backend.mapper.UserMapper;
import com.fintrack.backend.model.User;
import com.fintrack.backend.security.JwtTokenProvider;
import com.fintrack.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;

    private Long getUserIdFromToken(String token) {
        String jwt = token.substring(7);
        String username = jwtTokenProvider.getUsernameFromToken(jwt);
        User user = userService.getUserByUsername(username);
        return user.getId();
    }

    @PutMapping
    public ResponseEntity<UserProfileResponseDto> updateProfile(
            @RequestHeader("Authorization") String token,
            @RequestBody UserProfileDto dto
    ) {
        Long userId = getUserIdFromToken(token);
        User updatedUser = userService.updateProfile(userId, dto);
        return ResponseEntity.ok(userMapper.toResponseDto(updatedUser));
    }

    @GetMapping
    public ResponseEntity<UserProfileResponseDto> getProfile(
            @RequestHeader("Authorization") String token
    ) {
        Long userId = getUserIdFromToken(token);
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(userMapper.toResponseDto(user));
    }
}