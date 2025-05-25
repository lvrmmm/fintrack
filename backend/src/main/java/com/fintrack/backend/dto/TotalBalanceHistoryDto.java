package com.fintrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class TotalBalanceHistoryDto {
    private LocalDate date;
    private BigDecimal totalBalance;
}