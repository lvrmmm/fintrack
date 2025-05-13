package com.fintrack.backend.dto.request;

import com.fintrack.backend.model.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountCreateRequest {
    @NotBlank
    private String name;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal initialBalance;

    @NotBlank
    private String currency;

    @NotNull
    private PaymentMethod paymentMethod;
}