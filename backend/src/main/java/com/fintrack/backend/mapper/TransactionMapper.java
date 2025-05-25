package com.fintrack.backend.mapper;

import com.fintrack.backend.dto.request.TransactionCreateRequest;
import com.fintrack.backend.dto.request.TransactionServiceRequest;
import com.fintrack.backend.dto.response.TransactionResponse;
import com.fintrack.backend.model.Account;
import com.fintrack.backend.model.Transaction;
import com.fintrack.backend.model.User;
import org.springframework.stereotype.Component;

import java.time.LocalDate;


@Component
public class TransactionMapper {

    public TransactionResponse toResponse(Transaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .amount(tx.getAmount())
                .category(tx.getCategory())
                .accountId(tx.getAccount() != null ? tx.getAccount().getId() : null)
                .paymentMethod(tx.getPaymentMethod())
                .date(tx.getDate())
                .description(tx.getDescription())
                .type(tx.getType())
                .build();
    }

    public Transaction toEntity(TransactionServiceRequest request, User user, Account account) {
        return Transaction.builder()
                .amount(request.getAmount())
                .category(request.getCategory())
                .paymentMethod(request.getPaymentMethod())
                .date(request.getDate() != null ? request.getDate() : LocalDate.now())
                .description(request.getDescription())
                .type(request.getType())
                .user(user)
                .account(account)
                .build();
    }
}