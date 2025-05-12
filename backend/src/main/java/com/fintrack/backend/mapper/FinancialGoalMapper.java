package com.fintrack.backend.mapper;

import com.fintrack.backend.dto.FinancialGoalDto;
import com.fintrack.backend.model.FinancialGoal;
import com.fintrack.backend.model.User;
import org.springframework.stereotype.Component;

@Component
public class FinancialGoalMapper {

    public FinancialGoalDto toDto(FinancialGoal goal) {
        if (goal == null) return null;

        return FinancialGoalDto.builder()
                .id(goal.getId())
                .name(goal.getName())
                .targetAmount(goal.getTargetAmount())
                .currentAmount(goal.getCurrentAmount())
                .deadline(goal.getDeadline())
                .completed(goal.isCompleted())
                .priority(goal.getPriority())
                .notes(goal.getNotes())
                .type(goal.getType())
                .userId(goal.getUser() != null ? goal.getUser().getId() : null)
                .build();
    }

    public FinancialGoal toEntity(FinancialGoalDto dto, User user) {
        if (dto == null) return null;

        return FinancialGoal.builder()
                .id(dto.getId())
                .name(dto.getName())
                .targetAmount(dto.getTargetAmount())
                .currentAmount(dto.getCurrentAmount())
                .deadline(dto.getDeadline())
                .completed(dto.isCompleted())
                .priority(dto.getPriority())
                .notes(dto.getNotes())
                .type(dto.getType())
                .user(user)
                .build();
    }
}