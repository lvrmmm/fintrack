package com.fintrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeriodFilter {
    private LocalDate startDate;
    private LocalDate endDate;

    public boolean hasDateFilter() {
        return startDate != null || endDate != null;
    }
}
