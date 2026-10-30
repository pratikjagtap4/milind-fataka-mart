package com.fatakamart.repository;

import com.fatakamart.domain.entity.User;
import com.fatakamart.domain.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByMobile(String mobile);
    Boolean existsByEmail(String email);
    Boolean existsByMobile(String mobile);
    List<User> findByRole(Role role);
    List<User> findByShopId(Long shopId);
}
