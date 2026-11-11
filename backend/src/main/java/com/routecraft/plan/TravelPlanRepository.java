package com.routecraft.plan;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TravelPlanRepository extends JpaRepository<TravelPlan, Long> {
    List<TravelPlan> findAllByOwner_IdOrderByStartDateDesc(Long ownerId);
    Optional<TravelPlan> findByIdAndOwner_Id(Long id, Long ownerId);
}
