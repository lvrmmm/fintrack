package com.fintrack.backend.service;

import com.fintrack.backend.dto.response.BudgetDto;
import com.fintrack.backend.dto.response.BudgetStatsDto;
import com.fintrack.backend.exception.BudgetNotFoundException;
import com.fintrack.backend.mapper.BudgetMapper;
import com.fintrack.backend.model.Budget;
import com.fintrack.backend.model.BudgetId;
import com.fintrack.backend.model.TransactionCategory;
import com.fintrack.backend.model.User;
import com.fintrack.backend.repository.BudgetRepository;
import com.fintrack.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final UserService userService;
    private final BudgetMapper budgetMapper;

    @Transactional(readOnly = true)
    public List<BudgetDto> getBudgetForMonth(YearMonth month) {
        User currentUser = userService.getCurrentUser();
        return Arrays.stream(TransactionCategory.values())
                .map(category -> getBudgetForCategory(currentUser, category, month))
                .collect(Collectors.toList());
    }

    private BudgetDto getBudgetForCategory(User user, TransactionCategory category, YearMonth month) {
        BigDecimal spent = transactionRepository.sumAmountByUserAndCategoryAndMonth(
                user.getId(),
                category,
                month.atDay(1),
                month.atEndOfMonth()
        );

        return budgetRepository.findByUserAndCategoryAndMonth(user, category, month)
                .map(budget -> budgetMapper.toDto(budget, spent))
                .orElseGet(() -> createDefaultBudgetDto(user, category, month, spent));
    }

    private BudgetDto createDefaultBudgetDto(User user, TransactionCategory category,
                                             YearMonth month, BigDecimal spent) {
        BigDecimal zero = BigDecimal.ZERO;
        BigDecimal remaining = zero.subtract(spent != null ? spent : zero);

        return BudgetDto.builder()
                .userId(user.getId())
                .category(category.name())
                .month(month.toString())
                .limit(zero)
                .spent(spent != null ? spent : zero)
                .remaining(remaining)
                .progressPercentage(0)
                .isOverLimit(remaining.compareTo(zero) < 0)
                .build();
    }

    @Transactional(readOnly = true)
    public BudgetStatsDto getBudgetStats(YearMonth month) {
        User currentUser = userService.getCurrentUser();
        List<BudgetDto> budgets = getBudgetForMonth(month);

        int inBudget = (int) budgets.stream()
                .filter(b -> b.getLimit().compareTo(BigDecimal.ZERO) > 0)
                .filter(b -> !b.isOverLimit())
                .count();

        int exceeded = (int) budgets.stream()
                .filter(b -> b.getLimit().compareTo(BigDecimal.ZERO) > 0)
                .filter(BudgetDto::isOverLimit)
                .count();

        BigDecimal savings = budgets.stream()
                .filter(b -> b.getLimit().compareTo(BigDecimal.ZERO) > 0)
                .map(BudgetDto::getRemaining)
                .filter(r -> r.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return BudgetStatsDto.builder()
                .categoriesInBudget(inBudget)
                .categoriesExceeded(exceeded)
                .totalSavings(savings)
                .build();
    }

    @Transactional
    public BudgetDto setBudgetLimit(TransactionCategory category,
                                    BigDecimal limit,
                                    YearMonth month) {
        // Получаем текущего пользователя
        User currentUser = userService.getCurrentUser();

        // Создаем новый объект BudgetId
        BudgetId budgetId = new BudgetId(currentUser, category, month);

        // Ищем бюджет по составному ключу
        Budget budget = budgetRepository.findByUserAndCategoryAndMonth(currentUser, category, month)
                .orElseGet(() -> new Budget(budgetId, limit));

        // Устанавливаем лимит и сохраняем
        budget.setLimit(limit);
        Budget savedBudget = budgetRepository.save(budget);

        // Вычисляем потраченные деньги
        BigDecimal spent = transactionRepository.sumAmountByUserAndCategoryAndMonth(
                currentUser.getId(),
                category,
                month.atDay(1),
                month.atEndOfMonth());

        return budgetMapper.toDto(savedBudget, spent);
    }

    @Transactional
    public void removeBudgetLimit(TransactionCategory category, YearMonth month) {
        User currentUser = userService.getCurrentUser();
        budgetRepository.deleteByUserAndCategoryAndMonth(currentUser, category, month);
    }

    @Transactional(readOnly = true)
    public BudgetDto getBudgetById(BudgetId budgetId) {
        User currentUser = userService.getCurrentUser();
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new BudgetNotFoundException("Budget not found"));

        // Проверяем, принадлежит ли бюджет текущему пользователю
        if (!budget.getId().getUser().getId().equals(currentUser.getId())) {
            throw new BudgetNotFoundException("You don't have access to this budget");
        }

        BigDecimal spent = transactionRepository.sumAmountByUserAndCategoryAndMonth(
                currentUser.getId(),
                budget.getId().getCategory(),
                budget.getId().getMonth().atDay(1),
                budget.getId().getMonth().atEndOfMonth());

        return budgetMapper.toDto(budget, spent);
    }
}