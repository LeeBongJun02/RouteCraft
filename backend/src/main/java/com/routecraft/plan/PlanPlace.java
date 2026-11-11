package com.routecraft.plan;

import jakarta.persistence.*;

@Entity
@Table(name = "plan_places")
public class PlanPlace {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private TravelPlan plan;
    @Column(nullable = false, length = 150)
    private String name;
    @Column(nullable = false)
    private int dayNumber;
    @Column(nullable = false)
    private int orderIndex;
    @Column(length = 5)
    private String plannedTime;
    @Column(length = 500)
    private String notes;

    protected PlanPlace() {}
    PlanPlace(TravelPlan plan, String name, int dayNumber, int orderIndex, String plannedTime, String notes) {
        this.plan = plan; this.name = name; this.dayNumber = dayNumber; this.orderIndex = orderIndex;
        this.plannedTime = plannedTime; this.notes = notes;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public int getDayNumber() { return dayNumber; }
    public int getOrderIndex() { return orderIndex; }
    public String getPlannedTime() { return plannedTime; }
    public String getNotes() { return notes; }
}
