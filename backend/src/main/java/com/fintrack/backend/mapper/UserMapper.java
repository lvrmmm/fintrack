package com.fintrack.backend.mapper;

import com.fintrack.backend.dto.response.UserProfileResponseDto;
import com.fintrack.backend.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserProfileResponseDto toResponseDto(User user) {
        return UserProfileResponseDto.builder()
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .birthDate(user.getBirthDate())
                .gender(user.getGender())
                .bio(user.getBio())
                .build();
    }
}