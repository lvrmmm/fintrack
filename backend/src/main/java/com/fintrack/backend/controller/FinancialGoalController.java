package com.fintrack.backend.controller;

import com.fintrack.backend.dto.FinancialGoalDto;
import com.fintrack.backend.model.Priority;
import com.fintrack.backend.security.UserPrincipal;
import com.fintrack.backend.service.FinancialGoalService;
import com.fintrack.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class FinancialGoalController {
    private final FinancialGoalService goalService;
    private final UserService userService;

    @GetMapping
    public List<FinancialGoalDto> getAllGoals(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal.getUser().getId();  // Извлекаем id из UserPrincipal
        return goalService.getUserGoals(userId);
    }

    @PostMapping
    public FinancialGoalDto createGoal(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                       @RequestBody FinancialGoalDto dto) {
        Long userId = userPrincipal.getUser().getId();  // Извлекаем id из UserPrincipal
        return goalService.createGoal(userId, dto);
    }

    @PutMapping("/{id}")
    public FinancialGoalDto updateGoal(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                       @PathVariable Long id,
                                       @RequestBody FinancialGoalDto dto) {
        Long userId = userPrincipal.getUser().getId();  // Извлекаем id из UserPrincipal
        return goalService.updateGoal(userId, id, dto);
    }

    @DeleteMapping("/{id}")
    public void deleteGoal(@AuthenticationPrincipal UserPrincipal userPrincipal,
                           @PathVariable Long id) {
        Long userId = userPrincipal.getUser().getId();  // Извлекаем id из UserPrincipal
        goalService.deleteGoal(userId, id);
    }

    @PutMapping("/{id}/complete")
    public void completeGoal(@AuthenticationPrincipal UserPrincipal userPrincipal,
                             @PathVariable Long id) {
        Long userId = userPrincipal.getUser().getId();  // Извлекаем id из UserPrincipal
        goalService.completeGoal(userId, id);
    }

    @GetMapping("/stats")
    public Map<String, Long> getStats(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        Long userId = userPrincipal.getUser().getId();  // Извлекаем id из UserPrincipal
        return goalService.getStats(userId);
    }

    @GetMapping("/priority/{priority}")
    public List<FinancialGoalDto> getGoalsByPriority(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Priority priority) {
        Long userId = userPrincipal.getUser().getId();
        return goalService.getUserGoalsByPriority(userId, priority);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FinancialGoalDto> getGoalById(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                        @PathVariable Long id) {
        Long userId = userPrincipal.getUser().getId();
        FinancialGoalDto goal = goalService.getGoalById(userId, id);
        return ResponseEntity.ok(goal);
    }

}
