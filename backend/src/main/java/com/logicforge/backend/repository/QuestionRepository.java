package com.logicforge.backend.repository;

import com.logicforge.backend.model.Question;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QuestionRepository extends MongoRepository<Question, String> {
    Optional<Question> findByQuestionNumber(int questionNumber);
}
