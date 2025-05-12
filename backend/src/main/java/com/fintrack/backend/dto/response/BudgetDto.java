package com.fintrack.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class BudgetDto {
    private String category;
    private BigDecimal limit;
    private BigDecimal spent;
    private BigDecimal remaining;
    private int progressPercentage;
    private boolean isOverLimit;
}