package com.fintrack.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fintrack.backend.model.PaymentMethod;
import com.fintrack.backend.model.TransactionCategory;
import com.fintrack.backend.model.TransactionType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TransactionResponse {
    private Long id;
    private BigDecimal amount;
    private TransactionCategory category;
    private Long accountId;
    private PaymentMethod paymentMethod;
    private LocalDate date;
    private String description;
    private TransactionType type;
}