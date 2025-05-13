package com.fintrack.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class UserTotalBalanceDto {
    private BigDecimal totalBalance;
    private String mainCurrency;
    private List<AccountDto> accounts;
}