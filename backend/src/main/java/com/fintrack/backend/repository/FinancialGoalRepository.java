package com.fintrack.backend.repository;

import com.fintrack.backend.model.FinancialGoal;
import com.fintrack.backend.model.Priority;
import com.fintrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    long countByUserAndCompletedTrue(User user);

    long countByUserAndCompletedFalseAndDeadlineAfter(User user, LocalDate now);

    long countByUserAndCompletedFalseAndDeadlineBefore(User user, LocalDate now);

    @Modifying
    @Query("UPDATE FinancialGoal g SET g.completed = true WHERE g.id = :id AND g.user.id = :userId")
    int markAsCompleted(@Param("userId") Long userId, @Param("id") Long id);
}