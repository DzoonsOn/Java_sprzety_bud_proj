package pl.rental.web;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import pl.rental.dto.Dtos.*;
import pl.rental.service.ReservationService;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    private final ReservationService service;

    public ReservationController(ReservationService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ReservationDto create(@Valid @RequestBody ReservationRequest req, @AuthenticationPrincipal Jwt jwt) {
        return service.create(req, jwt);
    }

    @GetMapping("/my")
    List<ReservationDto> mine(@AuthenticationPrincipal Jwt jwt) {
        return service.mine(jwt);
    }

    @PostMapping("/{id}/cancel")
    ReservationDto cancel(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.cancel(id, jwt);
    }
}
