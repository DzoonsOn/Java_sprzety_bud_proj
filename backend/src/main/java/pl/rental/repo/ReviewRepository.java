package pl.rental.repo;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.rental.domain.Review;

@Repository
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