package com.fintrack.backend.exception;

public class ErrorResponse {

    private int status; // HTTP статус ошибки (например, 400, 404, 500 и т.д.)
    private String message; // Сообщение об ошибке
    private String debugMessage; // Дополнительное сообщение для отладки
    private long timestamp; // Время возникновения ошибки

    // Конструктор с параметрами
    public ErrorResponse(int status, String message, String debugMessage) {
        this.status = status;
        this.message = message;
        this.debugMessage = debugMessage;
        this.timestamp = System.currentTimeMillis();
    }

    // Геттеры и сеттеры
    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getDebugMessage() {
        return debugMessage;
    }

    public void setDebugMessage(String debugMessage) {
        this.debugMessage = debugMessage;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}