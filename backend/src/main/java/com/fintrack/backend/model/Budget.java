package com.fintrack.backend.model;


import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.YearMonth;


@Entity
@Table(name = "budget")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Budget {

    @EmbeddedId
    private BudgetId id; // Составной ключ

    @Column(name = "budget_limit")
    private BigDecimal limit;

    @Transient
    public User getUser() {
        return id != null ? id.getUser() : null;
    }

    @Transient
    public TransactionCategory getCategory() {
        return id != null ? id.getCategory() : null;
    }

    @Transient
    public YearMonth getMonth() {
        return id != null ? id.getMonth() : null;
    }
}