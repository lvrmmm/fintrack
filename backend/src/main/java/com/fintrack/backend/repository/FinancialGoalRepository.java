package com.fintrack.backend.repository;

import com.fintrack.backend.model.FinancialGoal;
import com.fintrack.backend.model.Priority;
import com.fintrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FinancialGoalRepository extends JpaRepository<FinancialGoal, Long> {
    List<FinancialGoal> findByUser(User user);

    List<FinancialGoal> findByUserAndPriority(User user, Priority priority);

    List<FinancialGoal> findByUserAndDeadlineBetween(User user, LocalDate startDate, LocalDate endDate);

    Optional<FinancialGoal> findByIdAndUserId(Long id, Long userId);

    long countByUserAndIsCompletedTrue(User user);

    long countByUserAndIsCompletedFalseAndDeadlineAfter(User user, LocalDate now);

    long countByUserAndIsCompletedFalseAndDeadlineBefore(User user, LocalDate now);
}