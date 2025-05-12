package com.fintrack.backend.model;

import com.fintrack.backend.converter.YearMonthAttributeConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.YearMonth;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BudgetId implements Serializable {

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionCategory category;

    @Convert(converter = YearMonthAttributeConverter.class)
    @Column(nullable = false)
    private YearMonth month;
}