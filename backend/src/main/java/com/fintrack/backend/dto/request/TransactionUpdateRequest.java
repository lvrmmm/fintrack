package com.fintrack.backend.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fintrack.backend.model.PaymentMethod;
import com.fintrack.backend.model.TransactionCategory;
import com.fintrack.backend.model.TransactionType;
import lombok.Data;

@Data
public class TransactionUpdateRequest {
    private BigDecimal amount;

    private TransactionCategory category;

    private PaymentMethod paymentMethod;

    private Long accountId;

    private LocalDate date;

    private String description;

    private TransactionType type;
}