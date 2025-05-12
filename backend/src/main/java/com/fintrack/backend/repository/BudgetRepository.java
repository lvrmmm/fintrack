package com.fintrack.backend.repository;

import com.fintrack.backend.model.Budget;
import com.fintrack.backend.model.BudgetId;
import com.fintrack.backend.model.TransactionCategory;
import com.fintrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, BudgetId> {

    @Query("SELECT b FROM Budget b WHERE b.id.user = :user AND b.id.category = :category AND b.id.month = :month")
    Optional<Budget> findByUserAndCategoryAndMonth(
            @Param("user") User user,
            @Param("category") TransactionCategory category,
            @Param("month") YearMonth month);

    @Query("SELECT b FROM Budget b WHERE b.id.user = :user AND b.id.month = :month")
    List<Budget> findByUserAndMonth(
            @Param("user") User user,
            @Param("month") YearMonth month);

    @Modifying
    @Query("DELETE FROM Budget b WHERE b.id.user = :user AND b.id.category = :category AND b.id.month = :month")
    void deleteByUserAndCategoryAndMonth(
            @Param("user") User user,
            @Param("category") TransactionCategory category,
            @Param("month") YearMonth month);
}