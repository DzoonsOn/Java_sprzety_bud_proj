package pl.rental.web;

import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public static ApiException notFound(String what) {
        return new ApiException(HttpStatus.NOT_FOUND, what + " nie istnieje");
    }

    public static ApiException badRequest(String msg) {
        return new ApiException(HttpStatus.BAD_REQUEST, msg);
    }

    public static ApiException conflict(String msg) {
        return new ApiException(HttpStatus.CONFLICT, msg);
    }

    public HttpStatus status() {
        return status;
    }

    @RestControllerAdvice
    static class Handler {
        @ExceptionHandler(ApiException.class)
        ResponseEntity<Map<String, String>> api(ApiException e) {
            return ResponseEntity.status(e.status()).body(Map.of("message", e.getMessage()));
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException e) {
            String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .collect(Collectors.joining("; "));
            return ResponseEntity.badRequest().body(Map.of("message", msg));
        }
    }
}
