package com.fintrack.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class BudgetStatsDto {
    private int categoriesInBudget;
    private int categoriesExceeded;
    private BigDecimal totalSavings;
}