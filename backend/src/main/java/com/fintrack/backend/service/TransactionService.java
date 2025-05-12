package com.fintrack.backend.service;


import com.fintrack.backend.dto.request.TransactionCreateRequest;
import com.fintrack.backend.dto.request.TransactionUpdateRequest;
import com.fintrack.backend.dto.response.TransactionResponse;
import com.fintrack.backend.dto.response.TransactionStatsResponse;
import com.fintrack.backend.exception.TransactionNotFoundException;
import com.fintrack.backend.exception.UserNotFoundException;
import com.fintrack.backend.mapper.TransactionMapper;
import com.fintrack.backend.model.*;
import com.fintrack.backend.repository.TransactionRepository;
import com.fintrack.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
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

    @Transactional
    public TransactionResponse createTransaction(Long userId, TransactionCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Transaction transaction = transactionMapper.toEntity(request, user);
        transactionRepository.save(transaction);

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

        if (request.getAmount() != null) {
            transaction.setAmount(request.getAmount());
        }
        if (request.getCategory() != null) {
            transaction.setCategory(request.getCategory());
        }
        if (request.getPaymentMethod() != null) {
            transaction.setPaymentMethod(request.getPaymentMethod());
        }
        if (request.getDate() != null) {
            transaction.setDate(request.getDate());
        }
        if (request.getDescription() != null) {
            transaction.setDescription(request.getDescription());
        }
        if (request.getType() != null) {
            transaction.setType(request.getType());
        }

        // Сохраняем обновленную транзакцию
        transactionRepository.save(transaction);

        return transactionMapper.toResponse(transaction);
    }

    @Transactional
    public void deleteTransaction(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found"));
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
            PaymentMethod paymentMethod,
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

        if (paymentMethod != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("paymentMethod"), paymentMethod));
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