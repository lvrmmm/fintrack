package com.fintrack.backend.dto.request;

import com.fintrack.backend.model.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountCreateRequest {
    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal initialBalance;

    @NotNull
    private PaymentMethod paymentMethod;
}