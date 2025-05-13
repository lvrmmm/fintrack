package com.fintrack.backend.controller;

import com.fintrack.backend.dto.request.BudgetRequest;
import com.fintrack.backend.dto.response.BudgetDto;
import com.fintrack.backend.dto.response.BudgetStatsDto;
import com.fintrack.backend.model.BudgetId;
import com.fintrack.backend.model.TransactionCategory;
import com.fintrack.backend.model.User;
import com.fintrack.backend.security.JwtTokenProvider;
import com.fintrack.backend.service.BudgetService;
import com.fintrack.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/budget")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<List<BudgetDto>> getBudgetForMonth(
            @RequestParam(required = false) YearMonth month) {
        return ResponseEntity.ok(budgetService.getBudgetForMonth(
                month != null ? month : YearMonth.now()));
    }

    @GetMapping("/stats")
    public ResponseEntity<BudgetStatsDto> getBudgetStats(
            @RequestParam(required = false) YearMonth month) {
        return ResponseEntity.ok(budgetService.getBudgetStats(
                month != null ? month : YearMonth.now()));
    }

    @PostMapping
    public ResponseEntity<BudgetDto> setBudgetLimit(
            @RequestBody BudgetRequest request,
            @RequestHeader("Authorization") String authHeader) {

        // Проверка авторизации
        String token = authHeader.substring(7); // Удаляем "Bearer "
        if (!jwtTokenProvider.validateToken(token)) {
            throw new AccessDeniedException("Invalid token");
        }

        return ResponseEntity.ok(budgetService.setBudgetLimit(
                request.getCategory(),
                request.getLimit(),
                request.getMonth() != null ? request.getMonth() : YearMonth.now()));
    }

    @DeleteMapping
    public ResponseEntity<Void> removeBudgetLimit(
            @RequestParam TransactionCategory category,
            @RequestParam(required = false) YearMonth month) {
        budgetService.removeBudgetLimit(
                category, month != null ? month : YearMonth.now());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/{category}/{month}")
    public ResponseEntity<BudgetDto> getBudget(
            @PathVariable Long userId,
            @PathVariable TransactionCategory category,
            @PathVariable String month) {
        User user = userService.getUserById(userId);
        YearMonth yearMonth = YearMonth.parse(month);
        BudgetId budgetId = new BudgetId(user, category, yearMonth);
        return ResponseEntity.ok(budgetService.getBudgetById(budgetId));
    }
}