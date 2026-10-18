package pl.rental.web;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import pl.rental.dto.Dtos.*;
import pl.rental.service.CatalogService;

/** Publiczny katalog (GET) + dodawanie opinii (wymaga logowania). */
@RestController
@RequestMapping("/api")
public class CatalogController {
    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/categories")
    List<CategoryDto> categories() {
        return catalog.categories();
    }

    @GetMapping("/equipment")
    List<EquipmentDto> list(@RequestParam(required = false) String q,
                            @RequestParam(required = false) Long categoryId,
                            @RequestParam(required = false) BigDecimal minPrice,
                            @RequestParam(required = false) BigDecimal maxPrice,
                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
                            @RequestParam(required = false) Double minRating,
                            @RequestParam(required = false) String sort) {
        return catalog.search(q, categoryId, minPrice, maxPrice, start, end, minRating, sort, false);
    }

    @GetMapping("/equipment/{id}")
    EquipmentDto get(@PathVariable Long id) {
        return catalog.get(id);
    }

    @GetMapping("/equipment/{id}/availability")
    Availability availability(@PathVariable Long id,
                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return catalog.availability(id, start, end);
    }

    @GetMapping("/equipment/{id}/reviews")
    List<ReviewDto> reviews(@PathVariable Long id) {
        return catalog.reviews(id);
    }

    @PostMapping("/equipment/{id}/reviews")
    ReviewDto addReview(@PathVariable Long id, @Valid @RequestBody ReviewRequest req, @AuthenticationPrincipal Jwt jwt) {
        return catalog.review(id, req, jwt);
    }
}
