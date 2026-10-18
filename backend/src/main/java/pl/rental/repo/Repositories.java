package pl.rental.repo;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.rental.domain.*;

public final class Repositories {
    private Repositories() {}

    public interface CategoryRepository extends JpaRepository<Category, Long> {}

    public interface EquipmentRepository extends JpaRepository<Equipment, Long>, JpaSpecificationExecutor<Equipment> {
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("select e from Equipment e where e.id = :id")
        Optional<Equipment> findForUpdate(@Param("id") Long id);

        boolean existsByCategoryId(Long categoryId);
    }

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
        java.math.BigDecimal sumRevenue(@Param("statuses") Collection<ReservationStatus> statuses);
    }

    public interface ReviewRepository extends JpaRepository<Review, Long> {
        List<Review> findByEquipmentIdOrderByCreatedAtDesc(Long equipmentId);

        Optional<Review> findByEquipmentIdAndUserId(Long equipmentId, String userId);

        @Modifying
        @Query("delete from Review r where r.equipment.id = :equipmentId")
        void deleteByEquipmentId(@Param("equipmentId") Long equipmentId);

        /** Zwraca wiersze [equipmentId, średnia ocena, liczba ocen]. */
        @Query("select r.equipment.id, avg(r.rating), count(r) from Review r group by r.equipment.id")
        List<Object[]> ratingSummary();
    }
}
