package com.fintrack.backend.model;

public enum PaymentMethod {
    // Наличные
    CASH("Наличные"),

    // Банковские карты
    DEBIT_CARD("Дебетовая карта"),
    CREDIT_CARD("Кредитная карта"),

    // Банковские счета
    SAVINGS_ACCOUNT("Сберегательный счет"),

    // Электронные кошельки
    ELECTRONIC_WALLET("Электронный кошелек"),

    // Инвестиции
    INVESTMENT_ACCOUNT("Инвестиционный счет"),
    BROKERAGE_ACCOUNT("Брокерский счет"),

    // Кредиты
    LOAN_ACCOUNT("Кредитный счет"),
    MORTGAGE_ACCOUNT("Ипотечный счет"),

    // Другие
    CRYPTOCURRENCY_WALLET("Криптовалютный кошелек"),
    OTHER("Другое");

    private final String displayName;

    PaymentMethod(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}