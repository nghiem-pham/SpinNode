package com.npham.spinnode.modules.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.user.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    java.util.List<User> findByDisplayNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String displayNameQuery, String emailQuery);
}
