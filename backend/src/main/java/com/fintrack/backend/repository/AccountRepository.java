package com.fintrack.backend.repository;

import com.fintrack.backend.dto.AccountBalanceHistoryDto;
import com.fintrack.backend.model.Account;
import com.fintrack.backend.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    // Найти все счета пользователя
    List<Account> findByUserId(Long userId);

    // Найти счет по ID пользователя
    Optional<Account> findByIdAndUserId(Long accountId, Long userId);

    // Найти счета по методу оплаты
    List<Account> findByUserIdAndPaymentMethod(Long userId, PaymentMethod paymentMethod);

    // Получить историю баланса счета
    @Query("SELECT NEW com.fintrack.backend.dto.AccountBalanceHistoryDto(t.date, SUM(t.amount)) " +
            "FROM Transaction t WHERE t.account.id = :accountId " +
            "GROUP BY t.date ORDER BY t.date")
    List<AccountBalanceHistoryDto> getBalanceHistory(@Param("accountId") Long accountId);

    // Получить общий баланс пользователя
    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.user.id = :userId")
    BigDecimal getTotalBalanceByUserId(Long userId);

    // Проверить существование счета у пользователя
    boolean existsByIdAndUserId(Long accountId, Long userId);

    // Найти основной счет пользователя (например, первый созданный)
    @Query("SELECT a FROM Account a WHERE a.user.id = :userId ORDER BY a.createdAt ASC LIMIT 1")
    Optional<Account> findPrimaryAccountByUserId(Long userId);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
            "FROM Account a WHERE a.id = :accountId AND a.user.id = :userId")
    boolean isAccountBelongsToUser(@Param("accountId") Long accountId,
                                   @Param("userId") Long userId);
}