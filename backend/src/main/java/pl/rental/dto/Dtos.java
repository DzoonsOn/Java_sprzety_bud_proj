package pl.rental.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import pl.rental.domain.ReservationStatus;

public final class Dtos {
    private Dtos() {}

    public record CategoryDto(Long id, String name, String icon) {}

    public record CategoryRequest(@NotBlank @Size(max = 100) String name, @Size(max = 16) String icon) {}

    public record EquipmentDto(Long id, String name, String description, CategoryDto category,
                               BigDecimal pricePerDay, int quantity, String imageUrl, boolean active,
                               double avgRating, long reviewCount, Integer availableUnits) {}

    public record EquipmentRequest(@NotBlank @Size(max = 200) String name,
                                   @Size(max = 2000) String description,
                                   @NotNull Long categoryId,
                                   @NotNull @Positive BigDecimal pricePerDay,
                                   @Min(1) int quantity,
                                   @Size(max = 500) String imageUrl,
                                   boolean active) {}

    public record Availability(int quantity, int occupied, int availableUnits, boolean available) {}

    public record ReservationRequest(@NotNull Long equipmentId, @NotNull LocalDate startDate,
                                     @NotNull LocalDate endDate, @Size(max = 500) String note) {}

    public record ReservationDto(Long id, Long equipmentId, String equipmentName, String equipmentImage,
                                 String userName, String userEmail, LocalDate startDate, LocalDate endDate,
                                 BigDecimal totalPrice, ReservationStatus status, String note, Instant createdAt) {}

    public record StatusRequest(@NotNull ReservationStatus status) {}

    public record ReviewRequest(@Min(1) @Max(5) int rating, @Size(max = 1000) String comment) {}

    public record ReviewDto(Long id, String userName, int rating, String comment, Instant createdAt) {}

    public record StatsDto(long equipmentCount, long reservationCount, long pendingCount,
                           long confirmedCount, BigDecimal revenue) {}
}
