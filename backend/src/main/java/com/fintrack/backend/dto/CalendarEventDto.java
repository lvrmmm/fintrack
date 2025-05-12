package com.fintrack.backend.dto;

import com.fintrack.backend.model.EventType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class CalendarEventDto {
    private Long id;
    private String title;
    private LocalDate date;
    private EventType type;
    private BigDecimal amount;
    private String category;
    private String notes;
    private Long goalId; // Для связи с финансовой целью
    private Long transactionId; // Для связи с транзакцией
    private String color; // Цвет для отображения в календаре
}