package com.fintrack.backend.controller;

import com.fintrack.backend.dto.AccountBalanceHistoryDto;
import com.fintrack.backend.dto.AccountDto;
import com.fintrack.backend.dto.UserTotalBalanceDto;
import com.fintrack.backend.dto.request.AccountCreateRequest;
import com.fintrack.backend.dto.request.AccountUpdateRequest;
import com.fintrack.backend.security.JwtTokenProvider;
import com.fintrack.backend.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final JwtTokenProvider jwtTokenProvider;

    // Получить все счета пользователя
    @GetMapping
    public ResponseEntity<List<AccountDto>> getUserAccounts(
            @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        List<AccountDto> accounts = accountService.getUserAccounts(userId);
        return ResponseEntity.ok(accounts);
    }

    // Получить счет по ID
    @GetMapping("/{id}")
    public ResponseEntity<AccountDto> getAccountById(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        Long userId = getUserIdFromToken(token);
        AccountDto account = accountService.getAccountById(userId, id);
        return ResponseEntity.ok(account);
    }

    // Создать новый счет
    @PostMapping
    public ResponseEntity<AccountDto> createAccount(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody AccountCreateRequest request) {
        Long userId = getUserIdFromToken(token);
        AccountDto account = accountService.createAccount(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(account);
    }

    // Обновить счет
    @PutMapping("/{id}")
    public ResponseEntity<AccountDto> updateAccount(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @Valid @RequestBody AccountUpdateRequest request) {
        Long userId = getUserIdFromToken(token);
        AccountDto account = accountService.updateAccount(userId, id, request);
        return ResponseEntity.ok(account);
    }

    // Удалить счет
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        Long userId = getUserIdFromToken(token);
        accountService.deleteAccount(userId, id);
        return ResponseEntity.noContent().build();
    }

    // Получить общий баланс
    @GetMapping("/total-balance")
    public ResponseEntity<UserTotalBalanceDto> getUserTotalBalance(
            @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        UserTotalBalanceDto balanceInfo = accountService.getUserTotalBalance(userId);
        return ResponseEntity.ok(balanceInfo);
    }

    // Получить историю баланса счета
    @GetMapping("/{id}/history")
    public ResponseEntity<List<AccountBalanceHistoryDto>> getAccountBalanceHistory(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Long userId = getUserIdFromToken(token);
        List<AccountBalanceHistoryDto> history = accountService.getAccountBalanceHistory(userId, id, startDate, endDate);
        return ResponseEntity.ok(history);
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