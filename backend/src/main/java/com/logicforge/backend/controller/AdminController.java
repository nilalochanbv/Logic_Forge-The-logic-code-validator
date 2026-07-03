package com.logicforge.backend.controller;

import com.logicforge.backend.model.Question;
import com.logicforge.backend.model.User;
import com.logicforge.backend.service.DatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private DatabaseService databaseService;

    @GetMapping("/users")
    public ResponseEntity<?> getAdminUsers() {
        try {
            List<User> users = databaseService.getAllUsers();
            List<Map<String, Object>> response = users.stream().map(u -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", u.getId());
                map.put("username", u.getUsername());
                map.put("email", u.getEmail());
                map.put("role", u.getRole());
                map.put("points", u.getPoints());
                map.put("currentStreak", u.getCurrentStreak());
                map.put("highestStreak", u.getHighestStreak());
                map.put("badgesCount", u.getBadges() != null ? u.getBadges().size() : 0);
                return map;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Admin users retrieve error"));
        }
    }

    @PostMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable String id, @RequestBody Map<String, String> body) {
        String role = body.get("role");
        if (role == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Role is required"));
        }

        try {
            User updated = databaseService.updateUserRole(id, role);
            if (updated == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }
            return ResponseEntity.ok(Map.of("message", "Role updated successfully", "user", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Admin role change error"));
        }
    }

    @PostMapping("/questions")
    public ResponseEntity<?> createQuestion(@RequestBody Question questionData) {
        try {
            List<Question> questions = databaseService.getQuestions();
            int nextNum = questions.stream()
                    .mapToInt(Question::getQuestionNumber)
                    .max()
                    .orElse(0) + 1;
            
            questionData.setQuestionNumber(nextNum);
            Question newQ = databaseService.createQuestion(questionData);
            return ResponseEntity.status(HttpStatus.CREATED).body(newQ);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Admin create question error"));
        }
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<?> updateQuestion(@PathVariable String id, @RequestBody Question questionData) {
        try {
            Question updated = databaseService.updateQuestion(id, questionData);
            if (updated == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Question not found"));
            }
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Admin update question error"));
        }
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable String id) {
        try {
            Question deleted = databaseService.deleteQuestion(id);
            if (deleted == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Question not found"));
            }
            return ResponseEntity.ok(Map.of("message", "Question deleted successfully", "deleted", deleted));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Admin delete question error"));
        }
    }
}
