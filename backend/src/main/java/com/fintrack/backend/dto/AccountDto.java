package com.fintrack.backend.dto;

import com.fintrack.backend.model.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountDto {
    private Long id;
    private String name;
    private BigDecimal balance;
    private String currency;
    private PaymentMethod paymentMethod;
    private LocalDate createdAt;
}