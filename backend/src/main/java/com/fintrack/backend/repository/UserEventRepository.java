package com.fintrack.backend.repository;

import com.fintrack.backend.model.UserEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserEventRepository extends JpaRepository<UserEvent, Long> {
    // Можно добавить дополнительные методы, если нужно
}