package com.fintrack.backend.controller;

import com.fintrack.backend.dto.CalendarEventDto;
import com.fintrack.backend.model.EventType;
import com.fintrack.backend.model.FinancialGoal;
import com.fintrack.backend.model.TransactionType;
import com.fintrack.backend.model.UserEvent;
import com.fintrack.backend.repository.FinancialGoalRepository;
import com.fintrack.backend.repository.UserEventRepository;
import com.fintrack.backend.security.UserPrincipal;
import com.fintrack.backend.service.FinancialGoalService;
import com.fintrack.backend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final TransactionService transactionService;
    private final FinancialGoalService goalService;
    private final UserEventRepository userEventRepository; // Репозиторий для пользовательских событий

    // Получение всех событий (транзакций, целей и пользовательских событий)
    @GetMapping
    public List<CalendarEventDto> getCalendarEvents(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        Long userId = userPrincipal.getUser().getId();

        // Получаем события из разных источников
        List<CalendarEventDto> events = new ArrayList<>();

        // Добавляем транзакции
        events.addAll(getTransactionEvents(userId, startDate, endDate));

        // Добавляем цели
        events.addAll(getGoalEvents(userId, startDate, endDate));

        // Добавляем пользовательские события
        events.addAll(getUserEvents(userId, startDate, endDate));

        return events;
    }

    // Метод для создания пользовательского события
    @PostMapping("/user-event")
    public ResponseEntity<CalendarEventDto> createUserEvent(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody UserEvent userEvent) {

        // Преобразуем в CalendarEventDto для ответа
        UserEvent savedEvent = userEventRepository.save(userEvent);

        CalendarEventDto savedEventDto = CalendarEventDto.builder()
                .id(savedEvent.getId())
                .title(savedEvent.getTitle())
                .date(savedEvent.getDate())
                .amount(savedEvent.getAmount())
                .category(savedEvent.getCategory())
                .notes(savedEvent.getNotes())
                .color(savedEvent.getColor())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(savedEventDto);
    }

    // Метод для удаления пользовательского события
    @DeleteMapping("/user-event/{eventId}")
    public ResponseEntity<Void> deleteUserEvent(@PathVariable Long eventId) {
        // Проверяем, существует ли событие с данным ID
        if (!userEventRepository.existsById(eventId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build(); // Возвращаем 404, если не нашли
        }

        // Удаляем событие
        userEventRepository.deleteById(eventId);

        // Возвращаем статус 200 OK, если удаление прошло успешно
        return ResponseEntity.ok().build();
    }

    // Метод для получения пользовательских событий
    private List<CalendarEventDto> getUserEvents(Long userId, LocalDate startDate, LocalDate endDate) {
        return userEventRepository.findAll().stream()
                .filter(event -> (startDate == null || !event.getDate().isBefore(startDate)) &&
                        (endDate == null || !event.getDate().isAfter(endDate)))
                .map(e -> CalendarEventDto.builder()
                        .id(e.getId())
                        .title(e.getTitle())
                        .date(e.getDate())
                        .type(EventType.REMINDER) // Можно использовать REMINDER для пользовательских событий
                        .amount(e.getAmount())
                        .category(e.getCategory())
                        .notes(e.getNotes())
                        .color(e.getColor())
                        .build())
                .collect(Collectors.toList());
    }

    // Получение событий для транзакций
    private List<CalendarEventDto> getTransactionEvents(Long userId, LocalDate startDate, LocalDate endDate) {
        return transactionService.getUserTransactions(userId, startDate, endDate, null).stream()
                .map(t -> CalendarEventDto.builder()
                        .id(t.getId())
                        .title(t.getDescription())
                        .date(t.getDate())
                        .type(t.getType() == TransactionType.INCOME ? EventType.TRANSACTION_INCOME : EventType.TRANSACTION_EXPENSE)
                        .amount(t.getAmount())
                        .category(t.getCategory().name())
                        .notes(String.format("Сумма: %s %s\nКатегория: %s\nОписание: %s",
                                t.getAmount(),
                                t.getType() == TransactionType.INCOME ? "поступление" : "расход",
                                t.getCategory().name(),
                                t.getDescription() != null ? t.getDescription() : "Без описания"))
                        .transactionId(t.getId())
                        .color(t.getType() == TransactionType.INCOME ? "#2ecc71" : "#e74c3c")
                        .build())
                .collect(Collectors.toList());
    }

    // Получение событий для целей
    private List<CalendarEventDto> getGoalEvents(Long userId, LocalDate startDate, LocalDate endDate) {
        return goalService.getUserGoals(userId).stream()
                .filter(g -> !g.isCompleted())
                .map(g -> CalendarEventDto.builder()
                        .id(g.getId())
                        .title(g.getName())
                        .date(g.getDeadline())
                        .type(EventType.GOAL_DEADLINE)
                        .amount(g.getTargetAmount())
                        .category("Цель")
                        .notes("Целевая сумма: " + g.getTargetAmount() + ", текущая: " + g.getCurrentAmount())
                        .goalId(g.getId())
                        .color("#3498db")
                        .build())
                .filter(e -> (startDate == null || !e.getDate().isBefore(startDate)) &&
                        (endDate == null || !e.getDate().isAfter(endDate)))
                .collect(Collectors.toList());
    }
}