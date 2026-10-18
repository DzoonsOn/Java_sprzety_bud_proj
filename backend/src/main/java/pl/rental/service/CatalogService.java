package pl.rental.service;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.rental.domain.*;
import pl.rental.dto.Dtos.*;
import pl.rental.repo.CategoryRepository;
import pl.rental.repo.EquipmentRepository;
import pl.rental.repo.ReservationRepository;
import pl.rental.repo.ReviewRepository;
import pl.rental.web.ApiException;

@Service
@Transactional(readOnly = true)
public class CatalogService {
    private final EquipmentRepository equipmentRepo;
    private final CategoryRepository categoryRepo;
    private final ReservationRepository reservationRepo;
    private final ReviewRepository reviewRepo;

    public CatalogService(EquipmentRepository equipmentRepo, CategoryRepository categoryRepo,
                          ReservationRepository reservationRepo, ReviewRepository reviewRepo) {
        this.equipmentRepo = equipmentRepo;
        this.categoryRepo = categoryRepo;
        this.reservationRepo = reservationRepo;
        this.reviewRepo = reviewRepo;
    }

    // ---------- kategorie ----------

    public List<CategoryDto> categories() {
        return categoryRepo.findAll().stream().sorted(Comparator.comparing(Category::getName))
                .map(CatalogService::toDto).toList();
    }

    @Transactional
    public CategoryDto saveCategory(Long id, CategoryRequest req) {
        Category c = id == null ? new Category()
                : categoryRepo.findById(id).orElseThrow(() -> ApiException.notFound("Kategoria"));
        c.setName(req.name().trim());
        c.setIcon(req.icon());
        return toDto(categoryRepo.save(c));
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepo.existsById(id)) throw ApiException.notFound("Kategoria");
        if (equipmentRepo.existsByCategoryId(id)) {
            throw ApiException.conflict("Kategoria zawiera sprzęt – najpierw go przenieś lub usuń");
        }
        categoryRepo.deleteById(id);
    }

    // ---------- sprzęt ----------

    public List<EquipmentDto> search(String q, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice,
                                     LocalDate start, LocalDate end, Double minRating, String sort,
                                     boolean includeInactive) {
        Specification<Equipment> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (!includeInactive) p.add(cb.isTrue(root.get("active")));
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                p.add(cb.or(cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(cb.coalesce(root.<String>get("description"), "")), like)));
            }
            if (categoryId != null) p.add(cb.equal(root.get("category").get("id"), categoryId));
            if (minPrice != null) p.add(cb.ge(root.<BigDecimal>get("pricePerDay"), minPrice));
            if (maxPrice != null) p.add(cb.le(root.<BigDecimal>get("pricePerDay"), maxPrice));
            return cb.and(p.toArray(Predicate[]::new));
        };

        Map<Long, double[]> ratings = ratingMap();
        boolean byDates = start != null && end != null && !end.isBefore(start);

        List<EquipmentDto> result = equipmentRepo.findAll(spec).stream()
                .map(e -> toDto(e, ratings, byDates ? availableUnits(e, start, end) : null))
                .filter(d -> minRating == null || d.avgRating() >= minRating)
                .filter(d -> !byDates || d.availableUnits() > 0)
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));

        Comparator<EquipmentDto> cmp = switch (sort == null ? "" : sort) {
            case "price_asc" -> Comparator.comparing(EquipmentDto::pricePerDay);
            case "price_desc" -> Comparator.comparing(EquipmentDto::pricePerDay).reversed();
            case "rating" -> Comparator.comparingDouble(EquipmentDto::avgRating).reversed()
                    .thenComparing(Comparator.comparingLong(EquipmentDto::reviewCount).reversed());
            case "name" -> Comparator.comparing(EquipmentDto::name, String.CASE_INSENSITIVE_ORDER);
            default -> Comparator.comparing(EquipmentDto::id).reversed();
        };
        result.sort(cmp);
        return result;
    }

    public EquipmentDto get(Long id) {
        return toDto(find(id), ratingMap(), null);
    }

    @Transactional
    public EquipmentDto saveEquipment(Long id, EquipmentRequest req) {
        Equipment e = id == null ? new Equipment() : find(id);
        e.setName(req.name().trim());
        e.setDescription(req.description());
        e.setCategory(categoryRepo.findById(req.categoryId()).orElseThrow(() -> ApiException.badRequest("Nieprawidłowa kategoria")));
        e.setPricePerDay(req.pricePerDay());
        e.setQuantity(req.quantity());
        e.setImageUrl(req.imageUrl() == null || req.imageUrl().isBlank() ? null : req.imageUrl().trim());
        e.setActive(req.active());
        return toDto(equipmentRepo.save(e), ratingMap(), null);
    }

    @Transactional
    public void deleteEquipment(Long id) {
        Equipment e = find(id);
        if (reservationRepo.existsByEquipmentId(id)) {
            throw ApiException.conflict("Sprzęt ma rezerwacje w historii – zamiast usuwać, wyłącz go (nieaktywny)");
        }
        reviewRepo.deleteByEquipmentId(id);
        equipmentRepo.delete(e);
    }

    // ---------- dostępność ----------

    public Availability availability(Long id, LocalDate start, LocalDate end) {
        Equipment e = find(id);
        if (end.isBefore(start)) throw ApiException.badRequest("Data końca przed datą początku");
        long occupied = reservationRepo.countOverlapping(id, ReservationStatus.BLOCKING, start, end);
        int free = (int) Math.max(0, e.getQuantity() - occupied);
        return new Availability(e.getQuantity(), (int) occupied, free, e.isActive() && free > 0);
    }

    private int availableUnits(Equipment e, LocalDate start, LocalDate end) {
        long occupied = reservationRepo.countOverlapping(e.getId(), ReservationStatus.BLOCKING, start, end);
        return (int) Math.max(0, e.getQuantity() - occupied);
    }

    // ---------- opinie ----------

    public List<ReviewDto> reviews(Long equipmentId) {
        find(equipmentId);
        return reviewRepo.findByEquipmentIdOrderByCreatedAtDesc(equipmentId).stream()
                .map(r -> new ReviewDto(r.getId(), r.getUserName(), r.getRating(), r.getComment(), r.getCreatedAt()))
                .toList();
    }

    @Transactional
    public ReviewDto review(Long equipmentId, ReviewRequest req, Jwt jwt) {
        Equipment e = find(equipmentId);
        String userId = jwt.getSubject();
        if (!reservationRepo.existsByEquipmentIdAndUserIdAndStatusNot(equipmentId, userId, ReservationStatus.CANCELLED)) {
            throw ApiException.badRequest("Opinię możesz dodać dopiero po zarezerwowaniu tego sprzętu");
        }
        Review r = reviewRepo.findByEquipmentIdAndUserId(equipmentId, userId).orElseGet(Review::new);
        r.setEquipment(e);
        r.setUserId(userId);
        r.setUserName(displayName(jwt));
        r.setRating(req.rating());
        r.setComment(req.comment());
        r = reviewRepo.save(r);
        return new ReviewDto(r.getId(), r.getUserName(), r.getRating(), r.getComment(), r.getCreatedAt());
    }

    // ---------- pomocnicze ----------

    public static String displayName(Jwt jwt) {
        String name = jwt.getClaimAsString("name");
        if (name == null || name.isBlank()) name = jwt.getClaimAsString("preferred_username");
        return name == null ? "Użytkownik" : name;
    }

    Equipment find(Long id) {
        return equipmentRepo.findById(id).orElseThrow(() -> ApiException.notFound("Sprzęt"));
    }

    private Map<Long, double[]> ratingMap() {
        Map<Long, double[]> map = new HashMap<>();
        for (Object[] row : reviewRepo.ratingSummary()) {
            map.put((Long) row[0], new double[]{((Number) row[1]).doubleValue(), ((Number) row[2]).doubleValue()});
        }
        return map;
    }

    static CategoryDto toDto(Category c) {
        return new CategoryDto(c.getId(), c.getName(), c.getIcon());
    }

    static EquipmentDto toDto(Equipment e, Map<Long, double[]> ratings, Integer availableUnits) {
        double[] r = ratings.getOrDefault(e.getId(), new double[]{0, 0});
        return new EquipmentDto(e.getId(), e.getName(), e.getDescription(), toDto(e.getCategory()),
                e.getPricePerDay(), e.getQuantity(), e.getImageUrl(), e.isActive(),
                Math.round(r[0] * 10) / 10.0, (long) r[1], availableUnits);
    }
}