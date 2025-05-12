package com.fintrack.backend.mapper;

import com.fintrack.backend.dto.response.BudgetDto;
import com.fintrack.backend.model.Budget;
import com.fintrack.backend.model.BudgetId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;


@Component
@RequiredArgsConstructor
public class BudgetMapper {

    public BudgetDto toDto(Budget budget, BigDecimal spent) {
        if (budget == null) {
            return null;
        }

        BudgetId budgetId = budget.getId();
        BigDecimal remaining = budget.getLimit().subtract(spent != null ? spent : BigDecimal.ZERO);
        int progressPercentage = calculateProgressPercentage(budget.getLimit(), spent);

        return BudgetDto.builder()
                .userId(budgetId.getUser().getId())  // Получаем ID пользователя из объекта User
                .category(budgetId.getCategory().name())
                .month(budgetId.getMonth().toString())
                .limit(budget.getLimit())
                .spent(spent != null ? spent : BigDecimal.ZERO)
                .remaining(remaining)
                .progressPercentage(progressPercentage)
                .isOverLimit(remaining.compareTo(BigDecimal.ZERO) < 0)
                .build();
    }

    private int calculateProgressPercentage(BigDecimal limit, BigDecimal spent) {
        if (limit == null || limit.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        if (spent == null) {
            return 0;
        }
        return spent.multiply(BigDecimal.valueOf(100))
                .divide(limit, 2, RoundingMode.HALF_UP)
                .intValue();
    }
}