package com.fintrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
public class AccountBalanceHistoryDto {

    private LocalDate date;
    private BigDecimal balance;

    // Конструктор для Hibernate
    public AccountBalanceHistoryDto(LocalDate date, BigDecimal balance) {
        this.date = date;
        this.balance = balance;
    }
}