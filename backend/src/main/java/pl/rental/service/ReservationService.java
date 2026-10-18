package pl.rental.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.rental.domain.*;
import pl.rental.dto.Dtos.*;
import pl.rental.repo.Repositories.*;
import pl.rental.web.ApiException;

@Service
@Transactional
public class ReservationService {
    private final ReservationRepository reservationRepo;
    private final EquipmentRepository equipmentRepo;

    public ReservationService(ReservationRepository reservationRepo, EquipmentRepository equipmentRepo) {
        this.reservationRepo = reservationRepo;
        this.equipmentRepo = equipmentRepo;
    }

    public ReservationDto create(ReservationRequest req, Jwt jwt) {
        if (req.startDate().isBefore(LocalDate.now())) throw ApiException.badRequest("Data początku nie może być w przeszłości");
        if (req.endDate().isBefore(req.startDate())) throw ApiException.badRequest("Data końca przed datą początku");

        // blokada wiersza sprzętu – serializuje równoległe rezerwacje tego samego produktu
        Equipment e = equipmentRepo.findForUpdate(req.equipmentId()).orElseThrow(() -> ApiException.notFound("Sprzęt"));
        if (!e.isActive()) throw ApiException.badRequest("Ten sprzęt jest obecnie niedostępny");

        long occupied = reservationRepo.countOverlapping(e.getId(), ReservationStatus.BLOCKING, req.startDate(), req.endDate());
        if (occupied >= e.getQuantity()) throw ApiException.conflict("Brak wolnych sztuk w wybranym terminie");

        long days = ChronoUnit.DAYS.between(req.startDate(), req.endDate()) + 1;
        Reservation r = new Reservation();
        r.setEquipment(e);
        r.setUserId(jwt.getSubject());
        r.setUserName(CatalogService.displayName(jwt));
        r.setUserEmail(jwt.getClaimAsString("email"));
        r.setStartDate(req.startDate());
        r.setEndDate(req.endDate());
        r.setTotalPrice(e.getPricePerDay().multiply(BigDecimal.valueOf(days)));
        r.setNote(req.note());
        return toDto(reservationRepo.save(r));
    }

    @Transactional(readOnly = true)
    public List<ReservationDto> mine(Jwt jwt) {
        return reservationRepo.findByUserIdOrderByCreatedAtDesc(jwt.getSubject()).stream().map(this::toDto).toList();
    }

    public ReservationDto cancel(Long id, Jwt jwt) {
        Reservation r = reservationRepo.findById(id).orElseThrow(() -> ApiException.notFound("Rezerwacja"));
        if (!r.getUserId().equals(jwt.getSubject())) throw ApiException.notFound("Rezerwacja");
        if (!Set.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED).contains(r.getStatus())) {
            throw ApiException.conflict("Tej rezerwacji nie można już anulować");
        }
        r.setStatus(ReservationStatus.CANCELLED);
        return toDto(r);
    }

    // ---------- admin ----------

    @Transactional(readOnly = true)
    public List<ReservationDto> all() {
        return reservationRepo.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    public ReservationDto setStatus(Long id, ReservationStatus status) {
        Reservation r = reservationRepo.findById(id).orElseThrow(() -> ApiException.notFound("Rezerwacja"));
        r.setStatus(status);
        return toDto(r);
    }

    @Transactional(readOnly = true)
    public StatsDto stats() {
        return new StatsDto(equipmentRepo.count(), reservationRepo.count(),
            reservationRepo.countByStatus(ReservationStatus.PENDING),
            reservationRepo.countByStatus(ReservationStatus.CONFIRMED),
            reservationRepo.sumRevenue(List.of(ReservationStatus.CONFIRMED, ReservationStatus.COMPLETED)));
    }

    private ReservationDto toDto(Reservation r) {
        Equipment e = r.getEquipment();
        return new ReservationDto(r.getId(), e.getId(), e.getName(), e.getImageUrl(), r.getUserName(), r.getUserEmail(),
            r.getStartDate(), r.getEndDate(), r.getTotalPrice(), r.getStatus(), r.getNote(), r.getCreatedAt());
    }
}
