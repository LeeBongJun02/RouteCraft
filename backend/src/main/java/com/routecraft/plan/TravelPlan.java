package com.routecraft.plan;

import com.routecraft.account.UserAccount;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "travel_plans")
public class TravelPlan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private UserAccount owner;
    @Column(nullable = false, length = 100)
    private String title;
    @Column(nullable = false, length = 120)
    private String destination;
    @Column(nullable = false)
    private LocalDate startDate;
    @Column(nullable = false)
    private int days;
    @Column(nullable = false)
    private int travelers;
    @Column(nullable = false, length = 30)
    private String transport;
    @Column(length = 1000)
    private String notes;
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayNumber ASC, orderIndex ASC")
    private List<PlanPlace> places = new ArrayList<>();

    protected TravelPlan() {}
    public TravelPlan(UserAccount owner, String title, String destination, LocalDate startDate,
                      int days, int travelers, String transport, String notes) {
        this.owner = owner; this.title = title; this.destination = destination; this.startDate = startDate;
        this.days = days; this.travelers = travelers; this.transport = transport; this.notes = notes;
    }
    public void replacePlaces(List<PlaceInput> inputs) {
        places.clear();
        for (int i = 0; i < inputs.size(); i++) {
            PlaceInput input = inputs.get(i);
            places.add(new PlanPlace(this, input.name(), input.dayNumber(), i, input.plannedTime(), input.notes()));
        }
        updatedAt = LocalDateTime.now();
    }
    public void update(String title, String destination, LocalDate startDate, int days,
                       int travelers, String transport, String notes, List<PlaceInput> inputs) {
        this.title = title; this.destination = destination; this.startDate = startDate; this.days = days;
        this.travelers = travelers; this.transport = transport; this.notes = notes; replacePlaces(inputs);
    }
    public Long getId() { return id; }
    public UserAccount getOwner() { return owner; }
    public String getTitle() { return title; }
    public String getDestination() { return destination; }
    public LocalDate getStartDate() { return startDate; }
    public int getDays() { return days; }
    public int getTravelers() { return travelers; }
    public String getTransport() { return transport; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<PlanPlace> getPlaces() { return places; }
}
