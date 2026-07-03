package com.logicforge.backend.controller;

import com.logicforge.backend.config.JwtFilter;
import com.logicforge.backend.model.Badge;
import com.logicforge.backend.model.Submission;
import com.logicforge.backend.model.User;
import com.logicforge.backend.service.AIService;
import com.logicforge.backend.service.DatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chatbot")
public class ChatController {

    @Autowired
    private DatabaseService databaseService;

    @Autowired
    private AIService aiService;

    @PostMapping("/message")
    public ResponseEntity<?> receiveBotMessage(@RequestBody Map<String, Object> body) {
        String message = (String) body.get("message");
        
        @SuppressWarnings("unchecked")
        List<Map<String, String>> chatHistory = (List<Map<String, String>>) body.get("chatHistory");
        if (chatHistory == null) {
            chatHistory = new ArrayList<>();
        }

        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Message cannot be empty"));
        }

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtFilter.UserPrincipal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        JwtFilter.UserPrincipal userPrincipal = (JwtFilter.UserPrincipal) principal;

        try {
            User user = databaseService.getUserById(userPrincipal.getId()).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            // Retrieve submissions count
            List<Submission> submissions = databaseService.getSubmissionsByUserId(user.getId());
            long solvedCount = submissions.stream()
                    .filter(s -> "correct".equalsIgnoreCase(s.getCorrectnessStatus()))
                    .count();

            // Find current highest ranking badge
            String currentBadge = "Novice";
            if (user.getBadges() != null && !user.getBadges().isEmpty()) {
                List<String> badgeRanking = Arrays.asList("titan", "grand_master", "master", "diamond", "platinum", "gold", "silver", "bronze", "iron_age");
                List<String> userBadgeIds = user.getBadges().stream().map(Badge::getBadgeId).collect(Collectors.toList());
                
                String topBadge = null;
                for (String rankingId : badgeRanking) {
                    if (userBadgeIds.contains(rankingId)) {
                        topBadge = rankingId;
                        break;
                    }
                }

                if (topBadge != null) {
                    currentBadge = Arrays.stream(topBadge.split("_"))
                            .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1))
                            .collect(Collectors.joining(" "));
                }
            }

            Map<String, Object> userStats = new HashMap<>();
            userStats.put("points", user.getPoints());
            userStats.put("currentStreak", user.getCurrentStreak());
            userStats.put("highestStreak", user.getHighestStreak());
            userStats.put("dailyStreak", user.getDailyStreak());
            userStats.put("currentBadge", currentBadge);
            userStats.put("solvedCount", (int) solvedCount);

            String reply = aiService.chatWithLogicBot(message, chatHistory, userStats);
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "LogicBot response failed"));
        }
    }
}
