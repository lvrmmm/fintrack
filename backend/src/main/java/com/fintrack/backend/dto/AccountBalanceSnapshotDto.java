package com.fintrack.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class AccountBalanceSnapshotDto {
    private LocalDate date;
    private BigDecimal balance;
}