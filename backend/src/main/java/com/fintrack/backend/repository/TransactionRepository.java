package com.fintrack.backend.repository;


import com.fintrack.backend.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    // Поиск транзакции по ID и пользователю
    Optional<Transaction> findByIdAndUserId(Long transactionId, Long userId);

    // Сумма транзакций по типу (доход или расход) для пользователя за период
    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.type = :type AND t.date BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByType(Long userId, TransactionType type, LocalDate startDate, LocalDate endDate);

    // Поиск транзакций по пользователю и категории (если фильтрация нужна по категории)
    List<Transaction> findByUserIdAndCategory(Long userId, TransactionCategory category);

    // Поиск транзакций по пользователю и периоду времени (с использованием LocalDate)
    List<Transaction> findByUserIdAndDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    // Обновленный метод для фильтрации транзакций с учетом всех параметров
    @Query("SELECT t FROM Transaction t WHERE " +
            "(t.type = :type OR :type IS NULL) AND " +
            "(t.category = :category OR :category IS NULL) AND " +
            "(t.paymentMethod = :paymentMethod OR :paymentMethod IS NULL) AND " +
            "(t.amount >= :amountMin OR :amountMin IS NULL) AND " +
            "(t.amount <= :amountMax OR :amountMax IS NULL) AND " +
            "(t.date >= :startDate OR :startDate IS NULL) AND " +
            "(t.date <= :endDate OR :endDate IS NULL) " +
            "AND t.user.id = :userId")
    List<Transaction> filterTransactions(Long userId,
                                         @Param("type") TransactionType type,
                                         @Param("category") TransactionCategory category,
                                         @Param("paymentMethod") PaymentMethod paymentMethod,
                                         @Param("amountMin") BigDecimal amountMin,
                                         @Param("amountMax") BigDecimal amountMax,
                                         @Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.user.id = :userId AND t.category = :category " +
            "AND t.date BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByUserAndCategoryAndMonth(
            @Param("userId") Long userId,
            @Param("category") TransactionCategory category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Альтернативный вариант с передачей объекта User
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.user = :user AND t.category = :category " +
            "AND t.date BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByUserAndCategoryAndMonth(
            @Param("user") User user,
            @Param("category") TransactionCategory category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}