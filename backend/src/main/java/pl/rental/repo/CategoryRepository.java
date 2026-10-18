package pl.rental.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.rental.domain.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {}