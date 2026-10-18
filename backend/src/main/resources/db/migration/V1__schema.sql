CREATE TABLE category (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(16)
);

CREATE TABLE equipment (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(200)   NOT NULL,
    description   VARCHAR(2000),
    category_id   BIGINT         NOT NULL REFERENCES category (id),
    price_per_day NUMERIC(10, 2) NOT NULL,
    quantity      INT            NOT NULL DEFAULT 1,
    image_url     VARCHAR(500),
    active        BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE reservation (
    id          BIGSERIAL PRIMARY KEY,
    equipment_id BIGINT         NOT NULL REFERENCES equipment (id),
    user_id     VARCHAR(64)    NOT NULL,
    user_name   VARCHAR(200),
    user_email  VARCHAR(200),
    start_date  DATE           NOT NULL,
    end_date    DATE           NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status      VARCHAR(20)    NOT NULL,
    note        VARCHAR(500),
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservation_equipment ON reservation (equipment_id, start_date, end_date);
CREATE INDEX idx_reservation_user ON reservation (user_id);

CREATE TABLE review (
    id           BIGSERIAL PRIMARY KEY,
    equipment_id BIGINT      NOT NULL REFERENCES equipment (id),
    user_id      VARCHAR(64) NOT NULL,
    user_name    VARCHAR(200),
    rating       INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      VARCHAR(1000),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (equipment_id, user_id)
);
