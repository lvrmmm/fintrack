package com.fintrack.backend.dto.request;


import java.math.BigDecimal;
import java.time.LocalDate;

import com.fintrack.backend.model.PaymentMethod;
import com.fintrack.backend.model.TransactionCategory;
import com.fintrack.backend.model.TransactionType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TransactionCreateRequest {
    @NotNull
    private BigDecimal amount;

    @NotNull
    private TransactionCategory category;

    @NotNull
    private PaymentMethod paymentMethod;

    private LocalDate date;

    private String description;

    @NotNull
    private TransactionType type;
}