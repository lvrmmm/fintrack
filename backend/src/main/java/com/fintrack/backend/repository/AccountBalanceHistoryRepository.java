package com.fintrack.backend.repository;

import com.fintrack.backend.dto.AccountBalanceSnapshotDto;
import com.fintrack.backend.model.Account;
import com.fintrack.backend.model.AccountBalanceHistory;
import com.fintrack.backend.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AccountBalanceHistoryRepository extends JpaRepository<AccountBalanceHistory, Long> {
    List<AccountBalanceHistory> findByAccountIdOrderByDateDesc(Long accountId);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
            "FROM Account a WHERE a.user.id = :userId AND a.paymentMethod = :paymentMethod")
    boolean existsByUserIdAndPaymentMethod(@Param("userId") Long userId,
                                           @Param("paymentMethod") PaymentMethod paymentMethod);

    @Query("SELECT h FROM AccountBalanceHistory h WHERE h.account.id = :accountId " +
            "AND (:startDate IS NULL OR h.date >= :startDate) " +
            "AND (:endDate IS NULL OR h.date <= :endDate) " +
            "ORDER BY h.date DESC")
    List<AccountBalanceHistory> findByAccountIdAndPeriod(
            @Param("accountId") Long accountId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);


    @Query("SELECT NEW com.fintrack.backend.dto.AccountBalanceSnapshotDto(" +
            "h.date, h.balance) " +
            "FROM AccountBalanceHistory h " +
            "WHERE h.account.id = :accountId " +
            "GROUP BY h.date, h.balance " +
            "ORDER BY h.date DESC")
    List<AccountBalanceSnapshotDto> findDailySnapshots(@Param("accountId") Long accountId);

    @Query("SELECT h FROM AccountBalanceHistory h " +
            "WHERE h.account.user.id = :userId " +
            "AND h.date BETWEEN :startDate AND :endDate " +
            "ORDER BY h.date")
    List<AccountBalanceHistory> findByUserIdAndPeriod(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    Optional<AccountBalanceHistory> findByAccountAndDate(Account account, LocalDate date);

    @Query("SELECT h FROM AccountBalanceHistory h JOIN FETCH h.account " +
            "WHERE h.account.id = :accountId " +
            "AND h.date BETWEEN :startDate AND :endDate " +
            "ORDER BY h.date DESC")
    List<AccountBalanceHistory> findByAccountIdWithAccount(
            @Param("accountId") Long accountId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}