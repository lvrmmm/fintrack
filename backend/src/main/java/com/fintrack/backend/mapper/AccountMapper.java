package com.fintrack.backend.mapper;

import com.fintrack.backend.dto.AccountDto;
import com.fintrack.backend.dto.request.AccountCreateRequest;
import com.fintrack.backend.dto.request.AccountUpdateRequest;
import com.fintrack.backend.model.Account;
import com.fintrack.backend.model.User;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class AccountMapper {
    public AccountDto toDto(Account account) {
        return AccountDto.builder()
                .id(account.getId())
                .name(account.getName())
                .balance(account.getBalance())
                .currency(account.getCurrency())
                .paymentMethod(account.getPaymentMethod())  // Обновлено
                .createdAt(account.getCreatedAt())
                .build();
    }

    public Account toEntity(AccountCreateRequest request, User user) {
        return Account.builder()
                .name(request.getName())
                .balance(request.getInitialBalance())
                .currency(request.getCurrency())
                .paymentMethod(request.getPaymentMethod())  // Обновлено
                .createdAt(LocalDate.now())
                .user(user)
                .build();
    }

    public void updateAccountFromRequest(AccountUpdateRequest request, Account account) {
        if (request.getName() != null) {
            account.setName(request.getName());
        }
        if (request.getCurrency() != null) {
            account.setCurrency(request.getCurrency());
        }
        if (request.getPaymentMethod() != null) {  // Обновлено
            account.setPaymentMethod(request.getPaymentMethod());
        }
    }
}