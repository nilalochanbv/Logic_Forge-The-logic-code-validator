package com.logicforge.backend.controller;

import com.logicforge.backend.config.JwtFilter;
import com.logicforge.backend.model.Question;
import com.logicforge.backend.model.Submission;
import com.logicforge.backend.service.AIService;
import com.logicforge.backend.service.DatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    @Autowired
    private DatabaseService databaseService;

    @Autowired
    private AIService aiService;

    @GetMapping
    public ResponseEntity<?> getAllQuestions() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtFilter.UserPrincipal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        
        JwtFilter.UserPrincipal userPrincipal = (JwtFilter.UserPrincipal) principal;
        
        try {
            List<Question> questions = databaseService.getQuestions();
            List<Submission> submissions = databaseService.getSubmissionsByUserId(userPrincipal.getId());

            List<Map<String, Object>> responseList = new ArrayList<>();
            for (Question q : questions) {
                String qIdStr = q.getId() != null ? q.getId() : String.valueOf(q.getQuestionNumber());
                
                // Find user's submissions for this specific question
                List<Submission> qSubmissions = new ArrayList<>();
                for (Submission s : submissions) {
                    if (s.getQuestionId() != null) {
                        if (s.getQuestionId().equals(q.getId()) || s.getQuestionId().equals(qIdStr) || s.getQuestionId().equals(String.valueOf(q.getQuestionNumber()))) {
                            qSubmissions.add(s);
                        }
                    }
                }

                boolean solved = qSubmissions.stream().anyMatch(s -> "correct".equalsIgnoreCase(s.getCorrectnessStatus()));
                int maxStars = qSubmissions.stream().mapToInt(Submission::getStars).max().orElse(0);

                Map<String, Object> qMap = new HashMap<>();
                qMap.put("_id", q.getId());
                qMap.put("questionNumber", q.getQuestionNumber());
                qMap.put("title", q.getTitle());
                qMap.put("difficulty", q.getDifficulty());
                qMap.put("description", q.getDescription());
                qMap.put("inputExamples", q.getInputExamples());
                qMap.put("constraints", q.getConstraints());
                qMap.put("hints", q.getHints());
                qMap.put("tags", q.getTags());
                qMap.put("completed", solved);
                qMap.put("stars", maxStars);

                responseList.add(qMap);
            }
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to fetch questions"));
        }
    }

    @GetMapping("/{number}")
    public ResponseEntity<?> getQuestionByNumber(@PathVariable int number) {
        try {
            Question question = databaseService.getQuestionByNumber(number).orElse(null);
            if (question == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Question not found"));
            }
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error fetching question"));
        }
    }

    @PostMapping("/mentor")
    public ResponseEntity<?> askMentorHint(@RequestBody Map<String, Object> body) {
        String questionTitle = (String) body.get("questionTitle");
        String questionDescription = (String) body.get("questionDescription");
        String userQuestion = (String) body.get("userQuestion");
        
        @SuppressWarnings("unchecked")
        List<Map<String, String>> chatHistory = (List<Map<String, String>>) body.get("chatHistory");
        if (chatHistory == null) {
            chatHistory = new ArrayList<>();
        }

        if (questionTitle == null || userQuestion == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Incomplete mentor request details"));
        }

        try {
            String reply = aiService.askMentor(questionTitle, questionDescription, userQuestion, chatHistory);
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Mentor response failed"));
        }
    }
}
