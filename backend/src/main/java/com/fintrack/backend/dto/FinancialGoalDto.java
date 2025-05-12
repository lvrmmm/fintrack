package com.fintrack.backend.dto;

import com.fintrack.backend.model.GoalType;
import com.fintrack.backend.model.Priority;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class FinancialGoalDto {
    private Long id;
    private String name;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private LocalDate deadline;
    private boolean isCompleted;
    private Priority priority;
    private String notes;
    private GoalType type;
    private Long userId; // Добавлено поле userId
}