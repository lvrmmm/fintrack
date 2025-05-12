package com.fintrack.backend.model;

public enum TransactionType {
    INCOME("Доход"),      // Зарплата, подарки, дивиденды
    EXPENSE("Расход");    // Покупки, услуги, платежи

    private final String displayName;

    TransactionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}