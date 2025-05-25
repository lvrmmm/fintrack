package com.fintrack.backend.controller;

import com.fintrack.backend.dto.AccountBalanceHistoryDto;
import com.fintrack.backend.dto.BalanceAdjustmentRequest;
import com.fintrack.backend.security.JwtTokenProvider;
import com.fintrack.backend.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/accounts/{accountId}/balance-history")
@RequiredArgsConstructor
public class AccountBalanceHistoryController {
    private final AccountService accountService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<List<AccountBalanceHistoryDto>> getAccountBalanceHistory(
            @RequestHeader("Authorization") String token,
            @PathVariable("accountId") Long accountId,  // Исправлено имя параметра
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        Long userId = getUserIdFromToken(token);
        List<AccountBalanceHistoryDto> history = accountService.getAccountBalanceHistory(
                userId, accountId, startDate, endDate
        );
        return ResponseEntity.ok(history);
    }


    @PostMapping("/adjust")
    public ResponseEntity<Void> manualBalanceAdjustment(
            @RequestHeader("Authorization") String token,
            @PathVariable Long accountId,
            @Valid @RequestBody BalanceAdjustmentRequest request) {

        Long userId = getUserIdFromToken(token);
        accountService.manualBalanceAdjustment(userId, accountId, request);
        return ResponseEntity.ok().build();
    }

    // Получить ID пользователя из токена
    private Long getUserIdFromToken(String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid Authorization header");
        }
        String jwt = token.substring(7);
        return jwtTokenProvider.getUserIdFromToken(jwt);
    }
}