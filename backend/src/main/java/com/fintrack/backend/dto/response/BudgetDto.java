package com.fintrack.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class BudgetDto {
    private Long userId;
    private String category;
    private String month;
    private BigDecimal limit;
    private BigDecimal spent;
    private BigDecimal remaining;
    private int progressPercentage;
    private boolean isOverLimit;
}
