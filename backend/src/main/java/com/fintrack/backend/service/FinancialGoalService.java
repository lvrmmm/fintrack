package com.fintrack.backend.service;

import com.fintrack.backend.dto.FinancialGoalDto;
import com.fintrack.backend.mapper.FinancialGoalMapper;
import com.fintrack.backend.model.FinancialGoal;
import com.fintrack.backend.model.GoalType;
import com.fintrack.backend.model.Priority;
import com.fintrack.backend.model.User;
import com.fintrack.backend.repository.FinancialGoalRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinancialGoalService {
    private final FinancialGoalRepository goalRepository;
    private final UserService userService;
    private final FinancialGoalMapper financialGoalMapper;

    public List<FinancialGoalDto> getUserGoals(Long userId) {
        User user = getUserById(userId);  // Получаем пользователя по его id
        return goalRepository.findByUser(user).stream()
                .map(this::toDto)
                .toList();
    }

    public FinancialGoalDto createGoal(Long userId, FinancialGoalDto dto) {
        User user = getUserById(userId);
        FinancialGoal goal = FinancialGoal.builder()
                .name(dto.getName())
                .targetAmount(dto.getTargetAmount())
                .currentAmount(dto.getCurrentAmount() != null ? dto.getCurrentAmount() : BigDecimal.ZERO)
                .deadline(dto.getDeadline())
                .isCompleted(false)
                .priority(dto.getPriority() != null ? dto.getPriority() : Priority.MEDIUM)
                .notes(dto.getNotes())
                .type(dto.getType() != null ? dto.getType() : GoalType.SAVING)
                .user(user)
                .build();
        goalRepository.save(goal);
        return toDto(goal);
    }

    public FinancialGoalDto updateGoal(Long userId, Long id, FinancialGoalDto dto) {
        User user = getUserById(userId);
        FinancialGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Goal not found"));

        if (!goal.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        goal.setName(dto.getName());
        goal.setTargetAmount(dto.getTargetAmount());
        goal.setCurrentAmount(dto.getCurrentAmount());
        goal.setDeadline(dto.getDeadline());
        goal.setPriority(dto.getPriority());
        goal.setNotes(dto.getNotes());
        goal.setType(dto.getType());
        goalRepository.save(goal);
        return toDto(goal);
    }

    public void deleteGoal(Long userId, Long id) {
        User user = getUserById(userId);
        FinancialGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Goal not found"));

        if (!goal.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        goalRepository.delete(goal);
    }

    public void completeGoal(Long userId, Long id) {
        User user = getUserById(userId);
        FinancialGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Goal not found"));

        if (!goal.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied");
        }

        goal.setCompleted(true);
        goalRepository.save(goal);
    }

    public Map<String, Long> getStats(Long userId) {
        User user = getUserById(userId);
        return createGoalStats(user);
    }

    private Map<String, Long> createGoalStats(User user) {
        return Map.of(
                "completed", goalRepository.countByUserAndIsCompletedTrue(user),
                "active", goalRepository.countByUserAndIsCompletedFalseAndDeadlineAfter(user, LocalDate.now()),
                "overdue", goalRepository.countByUserAndIsCompletedFalseAndDeadlineBefore(user, LocalDate.now())
        );
    }

    private FinancialGoalDto toDto(FinancialGoal goal) {
        return FinancialGoalDto.builder()
                .id(goal.getId())
                .name(goal.getName())
                .targetAmount(goal.getTargetAmount())
                .currentAmount(goal.getCurrentAmount())
                .deadline(goal.getDeadline())
                .isCompleted(goal.isCompleted())
                .priority(goal.getPriority())
                .notes(goal.getNotes())
                .type(goal.getType())
                .build();
    }

    public List<FinancialGoalDto> getUserGoalsByPriority(Long userId, Priority priority) {
        User user = getUserById(userId);
        return goalRepository.findByUserAndPriority(user, priority).stream()
                .map(this::toDto)
                .toList();
    }

    public List<FinancialGoalDto> getUserGoals(Long userId, LocalDate startDate, LocalDate endDate) {
        User user = getUserById(userId);
        return goalRepository.findByUserAndDeadlineBetween(user, startDate, endDate).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public FinancialGoalDto getGoalById(Long userId, Long goalId) {
        FinancialGoal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));
        return toDto(goal);
    }

    private User getUserById(Long userId) {
        return userService.getUserById(userId);
    }
}