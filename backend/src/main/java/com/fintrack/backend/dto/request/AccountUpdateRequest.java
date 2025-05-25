package com.fintrack.backend.dto.request;

import com.fintrack.backend.model.PaymentMethod;
import lombok.Data;

@Data
public class AccountUpdateRequest {
    private PaymentMethod paymentMethod;
}