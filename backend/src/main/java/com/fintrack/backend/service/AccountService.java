package com.fintrack.backend.service;

import com.fintrack.backend.dto.*;
import com.fintrack.backend.dto.request.AccountCreateRequest;
import com.fintrack.backend.dto.request.AccountUpdateRequest;
import com.fintrack.backend.exception.AccountNotFoundException;
import com.fintrack.backend.exception.UserNotFoundException;
import com.fintrack.backend.mapper.AccountMapper;
import com.fintrack.backend.model.*;
import com.fintrack.backend.repository.AccountBalanceHistoryRepository;
import com.fintrack.backend.repository.AccountRepository;
import com.fintrack.backend.repository.TransactionRepository;
import com.fintrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final AccountMapper accountMapper;
    private final TransactionRepository transactionRepository;
    private final AccountBalanceHistoryRepository balanceHistoryRepository;


    // Создать новый счет
    @Transactional
    public AccountDto createAccount(Long userId, AccountCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        // Проверяем, что у пользователя нет счета с таким paymentMethod
        if (accountRepository.existsByUserIdAndPaymentMethod(userId, request.getPaymentMethod())) {
            throw new IllegalStateException(
                    String.format("Account with payment method '%s' already exists for user %d",
                            request.getPaymentMethod().getDisplayName(), userId)
            );
        }

        Account account = accountMapper.toEntity(request, user);
        account = accountRepository.save(account);

        // Создаем начальную запись в истории баланса
        saveBalanceHistory(
                account,
                BigDecimal.ZERO,
                request.getInitialBalance(),
                BalanceChangeType.MANUAL_ADJUSTMENT,
                "Initial balance"
        );

        return accountMapper.toDto(account);
    }


    // Автоматическое создание счета для пользователя, если он его ещё не имеет, но совершает транзакцию
    @Transactional
    public Account createAutoAccount(User user, PaymentMethod paymentMethod) {
        Account newAccount = Account.builder()
                .balance(BigDecimal.ZERO)
                .paymentMethod(paymentMethod)
                .createdAt(LocalDate.now())
                .user(user)
                .build();
        return accountRepository.save(newAccount);
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
                .orElseThrow(() -> new AccountNotFoundException("Account not found"));
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

        return UserTotalBalanceDto.builder()
                .totalBalance(totalBalance)
                .accounts(accounts)
                .build();
    }



    // Получить историю баланса счета
    @Transactional(readOnly = true)
    public List<AccountBalanceHistoryDto> getAccountBalanceHistory(
            Long userId,
            Long accountId,
            LocalDate startDate,
            LocalDate endDate) {

        if (startDate == null) {
            startDate = LocalDate.now().minusMonths(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        // Проверяем принадлежность счета пользователю
        if (!accountRepository.existsByIdAndUserId(accountId, userId)) {
            throw new AccessDeniedException("Account doesn't belong to user");
        }

        // Получаем историю из репозитория
        List<AccountBalanceHistory> history;
        if (startDate != null || endDate != null) {
            // Валидация дат
            if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
                throw new IllegalArgumentException("Start date must be before end date");
            }

            history = balanceHistoryRepository.findByAccountIdAndPeriod(
                    accountId,
                    startDate,
                    endDate
            );
        } else {
            history = balanceHistoryRepository.findByAccountIdOrderByDateDesc(accountId);
        }

        // Конвертируем в DTO
        return history.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private AccountBalanceHistoryDto convertToDto(AccountBalanceHistory entity) {
        return AccountBalanceHistoryDto.builder()
                .date(entity.getDate())
                .balance(entity.getBalance())
                .balanceChange(entity.getBalanceChange())
                .changeType(entity.getChangeType())
                .description(entity.getDescription())
                .build();
    }


    // Обновить баланс счета (используется при создании/изменении транзакций)
    @Transactional
    public void updateAccountBalance(Long accountId, BigDecimal amount, TransactionType type) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found"));

        BigDecimal oldBalance = account.getBalance();
        BigDecimal newBalance = type == TransactionType.INCOME
                ? oldBalance.add(amount)
                : oldBalance.subtract(amount);

        account.setBalance(newBalance);
        accountRepository.save(account);

        // Всегда создаем новую запись в истории для каждого изменения
        createBalanceHistoryEntry(account, oldBalance, newBalance, type);
    }

    private void createBalanceHistoryEntry(Account account, BigDecimal oldBalance,
                                           BigDecimal newBalance, TransactionType type) {
        AccountBalanceHistory history = AccountBalanceHistory.builder()
                .account(account)
                .balance(newBalance)
                .balanceChange(newBalance.subtract(oldBalance))
                .date(LocalDate.now())
                .changeType(BalanceChangeType.TRANSACTION)
                .description(type.toString() + " transaction")
                .build();

        balanceHistoryRepository.save(history);
    }

    @Transactional
    public void manualBalanceAdjustment(Long userId, Long accountId,
                                        BalanceAdjustmentRequest request) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found"));

        BigDecimal oldBalance = account.getBalance();
        account.setBalance(request.getNewBalance());
        accountRepository.save(account);

        saveBalanceHistory(
                account,
                oldBalance,
                request.getNewBalance(),
                BalanceChangeType.MANUAL_ADJUSTMENT,
                request.getComment()
        );
    }

    private void saveBalanceHistory(Account account, BigDecimal oldBalance,
                                    BigDecimal newBalance, BalanceChangeType type,
                                    String description) {
        AccountBalanceHistory history = AccountBalanceHistory.builder()
                .account(account)
                .balance(newBalance)
                .balanceChange(newBalance.subtract(oldBalance))
                .date(LocalDate.now())
                .changeType(type)
                .description(description)
                .build();

        balanceHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public List<TotalBalanceHistoryDto> getUserTotalBalanceHistory(
            Long userId,
            LocalDate startDate,
            LocalDate endDate) {

        // Получаем ежедневные изменения баланса
        List<AccountBalanceHistory> history = balanceHistoryRepository
                .findByUserIdAndPeriod(userId, startDate, endDate);

        // Группируем по дате и суммируем балансы
        Map<LocalDate, BigDecimal> dailyBalances = history.stream()
                .collect(Collectors.groupingBy(
                        AccountBalanceHistory::getDate,
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                AccountBalanceHistory::getBalance,
                                BigDecimal::add
                        )
                ));

        // Заполняем пропущенные даты
        List<TotalBalanceHistoryDto> result = new ArrayList<>();
        LocalDate currentDate = startDate;

        BigDecimal runningBalance = BigDecimal.ZERO;
        while (!currentDate.isAfter(endDate)) {
            runningBalance = dailyBalances.getOrDefault(currentDate, runningBalance);
            result.add(new TotalBalanceHistoryDto(currentDate, runningBalance));
            currentDate = currentDate.plusDays(1);
        }

        return result;
    }

    @Transactional(readOnly = true)
    public boolean isAccountBelongsToUser(Long accountId, Long userId) {
        return accountRepository.existsByIdAndUserId(accountId, userId);
    }

}