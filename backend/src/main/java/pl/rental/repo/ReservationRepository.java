package pl.rental.repo;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.rental.domain.Reservation;
import pl.rental.domain.ReservationStatus;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    @Query("""
        select count(r) from Reservation r
        where r.equipment.id = :equipmentId and r.status in :statuses
          and r.startDate <= :end and r.endDate >= :start
        """)
    long countOverlapping(@Param("equipmentId") Long equipmentId,
                          @Param("statuses") Collection<ReservationStatus> statuses,
                          @Param("start") LocalDate start,
                          @Param("end") LocalDate end);

    List<Reservation> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Reservation> findAllByOrderByCreatedAtDesc();

    boolean existsByEquipmentId(Long equipmentId);

    boolean existsByEquipmentIdAndUserIdAndStatusNot(Long equipmentId, String userId, ReservationStatus status);

    long countByStatus(ReservationStatus status);

    @Query("select coalesce(sum(r.totalPrice), 0) from Reservation r where r.status in :statuses")
    BigDecimal sumRevenue(@Param("statuses") Collection<ReservationStatus> statuses);
}