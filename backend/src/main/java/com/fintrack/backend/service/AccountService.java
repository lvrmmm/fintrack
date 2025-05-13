package com.fintrack.backend.service;

import com.fintrack.backend.dto.AccountBalanceHistoryDto;
import com.fintrack.backend.dto.AccountDto;
import com.fintrack.backend.dto.UserTotalBalanceDto;
import com.fintrack.backend.dto.request.AccountCreateRequest;
import com.fintrack.backend.dto.request.AccountUpdateRequest;
import com.fintrack.backend.exception.AccountNotFoundException;
import com.fintrack.backend.exception.InsufficientFundsException;
import com.fintrack.backend.exception.UserNotFoundException;
import com.fintrack.backend.mapper.AccountMapper;
import com.fintrack.backend.model.Account;
import com.fintrack.backend.model.TransactionType;
import com.fintrack.backend.model.User;
import com.fintrack.backend.repository.AccountRepository;
import com.fintrack.backend.repository.TransactionRepository;
import com.fintrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final AccountMapper accountMapper;
    private final TransactionRepository transactionRepository;

    // Создать новый счет
    public AccountDto createAccount(Long userId, AccountCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        Account account = accountMapper.toEntity(request, user);
        account = accountRepository.save(account);

        return accountMapper.toDto(account);
    }

    // Получить все счета пользователя
    @Transactional(readOnly = true)
    public List<AccountDto> getUserAccounts(Long userId) {
        return accountRepository.findByUserId(userId).stream()
                .map(accountMapper::toDto)
                .collect(Collectors.toList());
    }

    // Получить счет по ID
    @Transactional(readOnly = true)
    public AccountDto getAccountById(Long userId, Long accountId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new AccountNotFoundException(
                        "Account not found with id: " + accountId + " for user: " + userId));

        return accountMapper.toDto(account);
    }

    // Обновить счет
    public AccountDto updateAccount(Long userId, Long accountId, AccountUpdateRequest request) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found"));

        accountMapper.updateAccountFromRequest(request, account);
        account = accountRepository.save(account);

        return accountMapper.toDto(account);
    }

    // Удалить счет
    public void deleteAccount(Long userId, Long accountId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found"));

        if (transactionRepository.existsByAccountId(accountId)) {
            throw new IllegalStateException("Cannot delete account with existing transactions");
        }

        accountRepository.delete(account);
    }

    // Получить общий баланс пользователя
    @Transactional(readOnly = true)
    public UserTotalBalanceDto getUserTotalBalance(Long userId) {
        BigDecimal totalBalance = accountRepository.getTotalBalanceByUserId(userId);
        List<AccountDto> accounts = getUserAccounts(userId);

        // Определяем основную валюту (берем из первого счета или дефолтную)
        String mainCurrency = accounts.stream()
                .findFirst()
                .map(AccountDto::getCurrency)
                .orElse("USD");

        return UserTotalBalanceDto.builder()
                .totalBalance(totalBalance)
                .mainCurrency(mainCurrency)
                .accounts(accounts)
                .build();
    }

    // Получить историю баланса счета
    @Transactional(readOnly = true)
    public List<AccountBalanceHistoryDto> getAccountBalanceHistory(Long userId, Long accountId,
                                                                   LocalDate startDate, LocalDate endDate) {
        if (!accountRepository.existsByIdAndUserId(accountId, userId)) {
            throw new AccountNotFoundException("Account not found");
        }

        List<AccountBalanceHistoryDto> history = accountRepository.getBalanceHistory(accountId);

        // Фильтрация по дате, если указана
        if (startDate != null || endDate != null) {
            history = history.stream()
                    .filter(dto -> (startDate == null || !dto.getDate().isBefore(startDate)))
                    .filter(dto -> (endDate == null || !dto.getDate().isAfter(endDate)))
                    .collect(Collectors.toList());
        }

        return history;
    }

    // Обновить баланс счета (используется при создании/изменении транзакций)
    @Transactional
    public void updateAccountBalance(Long accountId, BigDecimal amount, TransactionType type) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found"));

        BigDecimal newBalance = type == TransactionType.INCOME
                ? account.getBalance().add(amount)
                : account.getBalance().subtract(amount);

        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new InsufficientFundsException("Insufficient funds in account");
        }

        account.setBalance(newBalance);
        accountRepository.save(account);
    }

    @Transactional(readOnly = true)
    public boolean isAccountBelongsToUser(Long accountId, Long userId) {
        return accountRepository.existsByIdAndUserId(accountId, userId);
    }
}