package com.routecraft.plan;

import com.routecraft.account.AuthController;
import com.routecraft.account.UserAccount;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/plans")
public class TravelPlanController {
    private final TravelPlanRepository plans;
    private final AuthController auth;
    public TravelPlanController(TravelPlanRepository plans, AuthController auth) { this.plans = plans; this.auth = auth; }

    public record PlaceRequest(@NotBlank @Size(max = 150) String name,
                               @Min(1) int dayNumber, @Size(max = 5) String plannedTime,
                               @Size(max = 500) String notes) {}
    public record PlanRequest(@NotBlank @Size(max = 100) String title,
                              @NotBlank @Size(max = 120) String destination,
                              @NotNull LocalDate startDate, @Min(1) @Max(30) int days,
                              @Min(1) @Max(100) int travelers, @NotBlank @Size(max = 30) String transport,
                              @Size(max = 1000) String notes, List<@Valid PlaceRequest> places) {}
    public record PlaceResponse(Long id, String name, int dayNumber, int orderIndex, String plannedTime, String notes) {}
    public record PlanResponse(Long id, String title, String destination, LocalDate startDate, int days,
                               int travelers, String transport, String notes, LocalDateTime createdAt,
                               LocalDateTime updatedAt, List<PlaceResponse> places) {}

    @GetMapping
    @Transactional(readOnly = true)
    public List<PlanResponse> list(HttpSession session) {
        UserAccount user = auth.currentUser(session);
        return plans.findAllByOwner_IdOrderByStartDateDesc(user.getId()).stream().map(this::response).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public PlanResponse create(@Valid @RequestBody PlanRequest request, HttpSession session) {
        UserAccount user = auth.currentUser(session);
        TravelPlan plan = new TravelPlan(user, request.title().trim(), request.destination().trim(), request.startDate(),
                request.days(), request.travelers(), request.transport(), request.notes());
        plan.replacePlaces(inputs(request));
        return response(plans.save(plan));
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public PlanResponse get(@PathVariable Long id, HttpSession session) { return response(findOwned(id, session)); }

    @PutMapping("/{id}")
    @Transactional
    public PlanResponse update(@PathVariable Long id, @Valid @RequestBody PlanRequest request, HttpSession session) {
        TravelPlan plan = findOwned(id, session);
        plan.update(request.title().trim(), request.destination().trim(), request.startDate(), request.days(),
                request.travelers(), request.transport(), request.notes(), inputs(request));
        return response(plan);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id, HttpSession session) { plans.delete(findOwned(id, session)); }

    private TravelPlan findOwned(Long id, HttpSession session) {
        return plans.findByIdAndOwner_Id(id, auth.currentUser(session).getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "여행 플랜을 찾을 수 없습니다."));
    }
    private List<PlaceInput> inputs(PlanRequest request) {
        List<PlaceInput> places = request.places() == null ? List.of() : request.places().stream()
                .map(place -> new PlaceInput(place.name().trim(), place.dayNumber(), place.plannedTime(), place.notes())).toList();
        if (places.stream().anyMatch(place -> place.dayNumber() > request.days()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방문 날짜가 여행 기간을 초과했습니다.");
        return places;
    }
    private PlanResponse response(TravelPlan plan) {
        return new PlanResponse(plan.getId(), plan.getTitle(), plan.getDestination(), plan.getStartDate(), plan.getDays(),
                plan.getTravelers(), plan.getTransport(), plan.getNotes(), plan.getCreatedAt(), plan.getUpdatedAt(),
                plan.getPlaces().stream().map(place -> new PlaceResponse(place.getId(), place.getName(), place.getDayNumber(),
                        place.getOrderIndex(), place.getPlannedTime(), place.getNotes())).toList());
    }
}
