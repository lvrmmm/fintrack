package com.fintrack.backend.dto.request;


import java.math.BigDecimal;
import java.time.LocalDate;

import com.fintrack.backend.model.PaymentMethod;
import com.fintrack.backend.model.TransactionCategory;
import com.fintrack.backend.model.TransactionType;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Builder;
import lombok.Data;



@Data
@Builder
public class TransactionCreateRequest {
    @NotNull
    private LocalDate date;

    @NotNull
    private TransactionCategory category;

    @NotNull
    @Positive
    private BigDecimal amount;

    @NotNull
    private TransactionType type;

    private String description;

    @Nullable
    private Long accountId;

    @Nullable
    private PaymentMethod paymentMethod;
}