package com.fintrack.backend.dto.request;

import com.fintrack.backend.model.TransactionCategory;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.YearMonth;

@Data
@Builder
public class BudgetCreateUpdateDto {
    private TransactionCategory category;
    private YearMonth month;
    private BigDecimal limit;
}