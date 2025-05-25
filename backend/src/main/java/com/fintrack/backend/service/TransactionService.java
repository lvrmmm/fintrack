package com.fintrack.backend.service;


import com.fintrack.backend.dto.request.TransactionCreateRequest;
import com.fintrack.backend.dto.request.TransactionServiceRequest;
import com.fintrack.backend.dto.request.TransactionUpdateRequest;
import com.fintrack.backend.dto.response.TransactionResponse;
import com.fintrack.backend.dto.response.TransactionStatsResponse;
import com.fintrack.backend.exception.AccountNotFoundException;
import com.fintrack.backend.exception.TransactionNotFoundException;
import com.fintrack.backend.exception.UserNotFoundException;
import com.fintrack.backend.mapper.TransactionMapper;
import com.fintrack.backend.model.*;
import com.fintrack.backend.repository.AccountRepository;
import com.fintrack.backend.repository.TransactionRepository;
import com.fintrack.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {
        private final TransactionRepository transactionRepository;
        private final UserRepository userRepository;
        private final TransactionMapper transactionMapper;
        private final AccountRepository accountRepository;
        private final AccountService accountService;

        @Transactional
        public TransactionResponse createTransaction(Long userId, TransactionServiceRequest request) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new UserNotFoundException("User not found"));

            // Проверяем, что указан либо accountId, либо paymentMethod
            if (request.getAccountId() == null && request.getPaymentMethod() == null) {
                throw new IllegalArgumentException("Either accountId or paymentMethod must be provided");
            }

            Account account;

            // Если указан accountId, используем существующий счет
            if (request.getAccountId() != null) {
                account = accountRepository.findById(request.getAccountId())
                        .orElseThrow(() -> new AccountNotFoundException("Account not found"));

                // Проверяем принадлежность счета пользователю
                if (!account.getUser().getId().equals(userId)) {
                    throw new AccessDeniedException("Account doesn't belong to user");
                }
            }
            // Если указан paymentMethod, создаем/используем счет
            else {
                account = accountRepository.findByUserIdAndPaymentMethod(userId, request.getPaymentMethod())
                        .orElseGet(() -> {
                            // Создаем новый счет
                            Account newAccount = new Account();
                            newAccount.setUser(user);
                            newAccount.setPaymentMethod(request.getPaymentMethod());
                            newAccount.setBalance(BigDecimal.ZERO);
                            newAccount.setCreatedAt(LocalDate.now());
                            return accountRepository.save(newAccount);
                        });
            }

            // Создаем транзакцию
            Transaction transaction = new Transaction();
            transaction.setUser(user);
            transaction.setAccount(account);
            transaction.setPaymentMethod(account.getPaymentMethod());
            transaction.setAmount(request.getAmount());
            transaction.setCategory(request.getCategory());
            transaction.setDate(request.getDate());
            transaction.setDescription(request.getDescription());
            transaction.setType(request.getType());

            transaction = transactionRepository.save(transaction);

            // Обновляем баланс счета
            accountService.updateAccountBalance(account.getId(), transaction.getAmount(), transaction.getType());

            return transactionMapper.toResponse(transaction);
        }
        @Transactional(readOnly = true)
        public List<TransactionResponse> getUserTransactions(Long userId, LocalDate startDate, LocalDate endDate, TransactionCategory category) {
            Specification<Transaction> spec = Specification.where((root, query, cb) -> cb.equal(root.get("user").get("id"), userId));

            // Фильтруем по LocalDate, без учета времени
            if (startDate != null) {
                spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("date"), startDate));
            }

            if (endDate != null) {
                spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("date"), endDate));
            }

            if (category != null) {
                spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), category));
            }

            List<Transaction> transactions = transactionRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "date"));

            // Преобразуем в DTO
            return transactions.stream()
                    .map(transactionMapper::toResponse)
                    .collect(Collectors.toList());
        }

        @Transactional
        public TransactionResponse updateTransaction(Long userId, Long transactionId, TransactionUpdateRequest request) {
            Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                    .orElseThrow(() -> new TransactionNotFoundException("Transaction not found"));

            // Сохраняем старые значения для отката
            BigDecimal oldAmount = transaction.getAmount();
            TransactionType oldType = transaction.getType();
            Account oldAccount = transaction.getAccount();

            // Обновляем поля
            if (request.getAmount() != null) transaction.setAmount(request.getAmount());
            if (request.getCategory() != null) transaction.setCategory(request.getCategory());
            if (request.getDate() != null) transaction.setDate(request.getDate());
            if (request.getDescription() != null) transaction.setDescription(request.getDescription());
            if (request.getType() != null) transaction.setType(request.getType());

            // Если изменился счет
            if (request.getAccountId() != null && !request.getAccountId().equals(oldAccount.getId())) {
                Account newAccount = accountRepository.findById(request.getAccountId())
                        .orElseThrow(() -> new AccountNotFoundException("New account not found"));

                if (!newAccount.getUser().getId().equals(userId)) {
                    throw new AccessDeniedException("New account doesn't belong to user");
                }

                transaction.setAccount(newAccount);
                transaction.setPaymentMethod(newAccount.getPaymentMethod());
            }

            // Откатываем старую транзакцию
            accountService.updateAccountBalance(
                    oldAccount.getId(),
                    oldAmount,
                    oldType == TransactionType.INCOME ? TransactionType.EXPENSE : TransactionType.INCOME
            );

            // Применяем новую транзакцию
            accountService.updateAccountBalance(
                    transaction.getAccount().getId(),
                    transaction.getAmount(),
                    transaction.getType()
            );

            transaction = transactionRepository.save(transaction);
            return transactionMapper.toResponse(transaction);
        }

        @Transactional
        public void deleteTransaction(Long userId, Long transactionId) {
            Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                    .orElseThrow(() -> new TransactionNotFoundException("Transaction not found"));

            // Откатываем транзакцию
            accountService.updateAccountBalance(
                    transaction.getAccount().getId(),
                    transaction.getAmount(),
                    transaction.getType() == TransactionType.INCOME ? TransactionType.EXPENSE : TransactionType.INCOME
            );

            transactionRepository.delete(transaction);
        }


        @Transactional(readOnly = true)
        public TransactionStatsResponse getTransactionStats(Long userId, LocalDate startDate, LocalDate endDate) {
            BigDecimal totalIncome = Optional.ofNullable(
                    transactionRepository.sumAmountByType(userId, TransactionType.INCOME, startDate, endDate)
            ).orElse(BigDecimal.ZERO);

            BigDecimal totalExpense = Optional.ofNullable(
                    transactionRepository.sumAmountByType(userId, TransactionType.EXPENSE, startDate, endDate)
            ).orElse(BigDecimal.ZERO);

            BigDecimal netBalance = totalIncome.subtract(totalExpense);

            return new TransactionStatsResponse(totalIncome, totalExpense, netBalance);
        }

        public TransactionResponse getTransactionById(Long id) {
            Transaction transaction = transactionRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Transaction not found with ID: " + id));

            return transactionMapper.toResponse(transaction);
        }

        @Transactional(readOnly = true)
        public List<TransactionResponse> filterTransactions(
                Long userId,
                TransactionType type,
                TransactionCategory category,
                Long accountId,
                BigDecimal amountMin,
                BigDecimal amountMax,
                LocalDate startDate,
                LocalDate endDate) {

            Specification<Transaction> spec = Specification.where((root, query, cb) -> cb.equal(root.get("user").get("id"), userId));

            if (type != null) {
                spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), type));
            }

            if (category != null) {
                spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), category));
            }

            if (accountId != null) { // Изменено здесь
                spec = spec.and((root, query, cb) -> cb.equal(root.get("account").get("id"), accountId));
            }

            if (amountMin != null) {
                spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("amount"), amountMin));
            }

            if (amountMax != null) {
                spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("amount"), amountMax));
            }

            if (startDate != null) {
                spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("date"), startDate));
            }

            if (endDate != null) {
                spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("date"), endDate));
            }

            List<Transaction> transactions = transactionRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "date"));

            return transactions.stream()
                    .map(transactionMapper::toResponse)
                    .collect(Collectors.toList());
        }


    }