package pl.rental.web;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.rental.dto.Dtos.*;
import pl.rental.service.CatalogService;
import pl.rental.service.ReservationService;

/** Panel administratora – cały prefiks /api/admin wymaga roli ADMIN (patrz SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final CatalogService catalog;
    private final ReservationService reservations;

    public AdminController(CatalogService catalog, ReservationService reservations) {
        this.catalog = catalog;
        this.reservations = reservations;
    }

    @GetMapping("/stats")
    StatsDto stats() {
        return reservations.stats();
    }

    // sprzęt (z nieaktywnym)
    @GetMapping("/equipment")
    List<EquipmentDto> equipment() {
        return catalog.search(null, null, null, null, null, null, null, "name", true);
    }

    @PostMapping("/equipment")
    @ResponseStatus(HttpStatus.CREATED)
    EquipmentDto createEquipment(@Valid @RequestBody EquipmentRequest req) {
        return catalog.saveEquipment(null, req);
    }

    @PutMapping("/equipment/{id}")
    EquipmentDto updateEquipment(@PathVariable Long id, @Valid @RequestBody EquipmentRequest req) {
        return catalog.saveEquipment(id, req);
    }

    @DeleteMapping("/equipment/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteEquipment(@PathVariable Long id) {
        catalog.deleteEquipment(id);
    }

    // kategorie
    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    CategoryDto createCategory(@Valid @RequestBody CategoryRequest req) {
        return catalog.saveCategory(null, req);
    }

    @PutMapping("/categories/{id}")
    CategoryDto updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest req) {
        return catalog.saveCategory(id, req);
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteCategory(@PathVariable Long id) {
        catalog.deleteCategory(id);
    }

    // rezerwacje
    @GetMapping("/reservations")
    List<ReservationDto> reservations() {
        return reservations.all();
    }

    @PatchMapping("/reservations/{id}/status")
    ReservationDto setStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest req) {
        return reservations.setStatus(id, req.status());
    }
}
