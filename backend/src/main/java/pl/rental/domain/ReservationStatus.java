package pl.rental.domain;

import java.util.List;

public enum ReservationStatus {
    PENDING, CONFIRMED, CANCELLED, COMPLETED;

    /** Statusy, które blokują dostępność sprzętu. */
    public static final List<ReservationStatus> BLOCKING = List.of(PENDING, CONFIRMED);
}
