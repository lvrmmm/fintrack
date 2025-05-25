package com.fintrack.backend.dto;

import com.fintrack.backend.model.BalanceChangeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class AccountBalanceHistoryDto {
    private LocalDate date;
    private BigDecimal balance;
    private BigDecimal balanceChange;
    private BalanceChangeType changeType;
    private String description;
}