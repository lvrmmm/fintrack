package com.fintrack.backend.dto.request;

import com.fintrack.backend.model.TransactionCategory;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.YearMonth;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BudgetRequest {
    private TransactionCategory category;

    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal limit;
    private YearMonth month;
}