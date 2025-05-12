package com.fintrack.backend.controller;

import com.fintrack.backend.dto.request.TransactionCreateRequest;
import com.fintrack.backend.dto.request.TransactionUpdateRequest;
import com.fintrack.backend.dto.response.TransactionResponse;
import com.fintrack.backend.dto.response.TransactionStatsResponse;
import com.fintrack.backend.model.PaymentMethod;
import com.fintrack.backend.model.TransactionCategory;
import com.fintrack.backend.model.TransactionType;
import com.fintrack.backend.security.JwtTokenProvider;
import com.fintrack.backend.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getUserTransactions(
            @RequestHeader("Authorization") String token,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) TransactionCategory category) {

        Long userId = getUserIdFromToken(token);
        List<TransactionResponse> response = transactionService.getUserTransactions(userId, startDate, endDate, category);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody TransactionCreateRequest request) {

        Long userId = getUserIdFromToken(token);
        TransactionResponse response = transactionService.createTransaction(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> updateTransaction(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @Valid @RequestBody TransactionUpdateRequest request) {

        Long userId = getUserIdFromToken(token);
        TransactionResponse response = transactionService.updateTransaction(userId, id, request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponse> getTransactionById(@PathVariable Long id) {
        TransactionResponse response = transactionService.getTransactionById(id);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {

        Long userId = getUserIdFromToken(token);
        transactionService.deleteTransaction(userId, id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<TransactionStatsResponse> getTransactionStats(
            @RequestHeader("Authorization") String token,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {

        Long userId = getUserIdFromToken(token);
        TransactionStatsResponse stats = transactionService.getTransactionStats(userId, startDate, endDate);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/filter")
    public ResponseEntity<List<TransactionResponse>> getFilteredTransactions(
            @RequestHeader("Authorization") String token,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, name = "paymentMethod") String paymentMethod,
            @RequestParam(required = false) Double amountMin,
            @RequestParam(required = false) Double amountMax,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateEnd) {

        Long userId = getUserIdFromToken(token);

        TransactionType transactionType = parseEnum(type, TransactionType.class);
        TransactionCategory transactionCategory = parseEnum(category, TransactionCategory.class);
        PaymentMethod paymentMethodEnum = parseEnum(paymentMethod, PaymentMethod.class);

        BigDecimal amountMinValue = amountMin != null ? BigDecimal.valueOf(amountMin) : null;
        BigDecimal amountMaxValue = amountMax != null ? BigDecimal.valueOf(amountMax) : null;

        List<TransactionResponse> response = transactionService.filterTransactions(
                userId,
                transactionType,
                transactionCategory,
                paymentMethodEnum,
                amountMinValue,
                amountMaxValue,
                dateStart,
                dateEnd
        );

        return ResponseEntity.ok(response);
    }

    private <T extends Enum<T>> T parseEnum(String value, Class<T> enumClass) {
        if (value == null || value.equalsIgnoreCase("all")) {
            return null;
        }
        try {
            return Enum.valueOf(enumClass, value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid value for " + enumClass.getSimpleName() + ": " + value);
        }
    }

    private Long getUserIdFromToken(String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Неверный заголовок Authorization");
        }
        String jwt = token.substring(7);
        return jwtTokenProvider.getUserIdFromToken(jwt);
    }
}