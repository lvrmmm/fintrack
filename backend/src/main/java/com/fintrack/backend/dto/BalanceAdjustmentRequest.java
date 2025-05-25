package com.fintrack.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BalanceAdjustmentRequest {
    @NotNull
    @DecimalMin("0.00")
    private BigDecimal newBalance;

    @Size(max = 255)
    private String comment;
}