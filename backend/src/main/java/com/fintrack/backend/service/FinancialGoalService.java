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
import org.springframework.transaction.annotation.Transactional;
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
        User user = getUserById(userId);
        return goalRepository.findByUser(user).stream()
                .map(financialGoalMapper::toDto)
                .toList();
    }

    public FinancialGoalDto createGoal(Long userId, FinancialGoalDto dto) {
        User user = getUserById(userId);
        FinancialGoal goal = financialGoalMapper.toEntity(dto, user);
        // Проставим значения по умолчанию
        if (goal.getCurrentAmount() == null) goal.setCurrentAmount(BigDecimal.ZERO);
        if (goal.getPriority() == null) goal.setPriority(Priority.MEDIUM);
        if (goal.getType() == null) goal.setType(GoalType.SAVING);
        goal.setCompleted(false);

        goalRepository.save(goal);
        return financialGoalMapper.toDto(goal);
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
        return financialGoalMapper.toDto(goal);
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

    @Transactional
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
                "completed", goalRepository.countByUserAndCompletedTrue(user),
                "active", goalRepository.countByUserAndCompletedFalseAndDeadlineAfter(user, LocalDate.now()),
                "overdue", goalRepository.countByUserAndCompletedFalseAndDeadlineBefore(user, LocalDate.now())
        );
    }

    public List<FinancialGoalDto> getUserGoalsByPriority(Long userId, Priority priority) {
        User user = getUserById(userId);
        return goalRepository.findByUserAndPriority(user, priority).stream()
                .map(financialGoalMapper::toDto)
                .toList();
    }

    public List<FinancialGoalDto> getUserGoals(Long userId, LocalDate startDate, LocalDate endDate) {
        User user = getUserById(userId);
        return goalRepository.findByUserAndDeadlineBetween(user, startDate, endDate).stream()
                .map(financialGoalMapper::toDto)
                .collect(Collectors.toList());
    }

    public FinancialGoalDto getGoalById(Long userId, Long goalId) {
        FinancialGoal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));
        return financialGoalMapper.toDto(goal);
    }

    private User getUserById(Long userId) {
        return userService.getUserById(userId);
    }
}