package com.logicforge.backend.controller;

import com.logicforge.backend.config.JwtFilter;
import com.logicforge.backend.model.Activity;
import com.logicforge.backend.model.Question;
import com.logicforge.backend.model.Submission;
import com.logicforge.backend.model.User;
import com.logicforge.backend.model.Badge;
import com.logicforge.backend.service.DatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class DashboardController {

    @Autowired
    private DatabaseService databaseService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> getDashboardStats() {
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

            List<Activity> activities = databaseService.getActivitiesByUserId(user.getId());
            // Sort activities newest first and limit to 8
            activities.sort((a, b) -> b.getDate().compareTo(a.getDate()));
            List<Activity> recentActivities = activities.stream().limit(8).collect(Collectors.toList());

            List<Question> questions = databaseService.getQuestions();
            List<Submission> submissions = databaseService.getSubmissionsByUserId(user.getId());

            Map<String, Integer> totalCount = new HashMap<>(Map.of("easy", 0, "medium", 0, "hard", 0));
            Map<String, Integer> solvedCount = new HashMap<>(Map.of("easy", 0, "medium", 0, "hard", 0));

            for (Question q : questions) {
                String diff = q.getDifficulty().toLowerCase();
                totalCount.put(diff, totalCount.getOrDefault(diff, 0) + 1);

                String qIdStr = q.getId() != null ? q.getId() : String.valueOf(q.getQuestionNumber());
                boolean isSolved = false;
                for (Submission s : submissions) {
                    if (s.getQuestionId() != null) {
                        boolean match = s.getQuestionId().equals(q.getId()) || 
                                        s.getQuestionId().equals(qIdStr) || 
                                        s.getQuestionId().equals(String.valueOf(q.getQuestionNumber()));
                        if (match && "correct".equalsIgnoreCase(s.getCorrectnessStatus())) {
                            isSolved = true;
                            break;
                        }
                    }
                }

                if (isSolved) {
                    solvedCount.put(diff, solvedCount.getOrDefault(diff, 0) + 1);
                }
            }

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
                    // format topBadge from snake_case to Title Case (e.g. iron_age -> Iron Age)
                    currentBadge = Arrays.stream(topBadge.split("_"))
                            .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1))
                            .collect(Collectors.joining(" "));
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("points", user.getPoints());
            response.put("currentStreak", user.getCurrentStreak());
            response.put("highestStreak", user.getHighestStreak());
            response.put("currentBadge", currentBadge);
            response.put("recentActivities", recentActivities);
            
            Map<String, Object> progress = new HashMap<>();
            progress.put("total", totalCount);
            progress.put("solved", solvedCount);
            response.put("progress", progress);

            response.put("dailyStreak", user.getDailyStreak());
            response.put("lastDailySolvedDate", user.getLastDailySolvedDate());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to retrieve stats"));
        }
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
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

            List<Submission> submissions = databaseService.getSubmissionsByUserId(user.getId());
            List<Activity> activities = databaseService.getActivitiesByUserId(user.getId());

            List<Submission> correctSubmissions = submissions.stream()
                    .filter(s -> "correct".equalsIgnoreCase(s.getCorrectnessStatus()))
                    .collect(Collectors.toList());

            // 1. Success rate
            int totalAttempts = submissions.size();
            int successfulAttempts = correctSubmissions.size();
            int successRate = totalAttempts > 0 ? (int) Math.round(((double) successfulAttempts / totalAttempts) * 100) : 0;

            // 2. Heatmap contribution calendar mapping
            Map<String, Integer> calendarGrid = new HashMap<>();
            for (Activity act : activities) {
                if (act.getDate() != null) {
                    calendarGrid.put(act.getDate(), calendarGrid.getOrDefault(act.getDate(), 0) + 1);
                }
            }

            List<Map<String, Object>> contributionData = new ArrayList<>();
            for (Map.Entry<String, Integer> entry : calendarGrid.entrySet()) {
                Map<String, Object> item = new HashMap<>();
                item.put("date", entry.getKey());
                item.put("count", entry.getValue());
                contributionData.add(item);
            }

            // 3. Solved distribution by difficulty
            List<Question> questions = databaseService.getQuestions();
            Set<String> solvedQuestionIds = new HashSet<>();
            for (Submission s : submissions) {
                if ("correct".equalsIgnoreCase(s.getCorrectnessStatus()) && s.getQuestionId() != null) {
                    solvedQuestionIds.add(s.getQuestionId());
                }
            }

            int easyCount = 0, mediumCount = 0, hardCount = 0;
            for (Question q : questions) {
                String qIdStr = q.getId() != null ? q.getId() : String.valueOf(q.getQuestionNumber());
                if (solvedQuestionIds.contains(q.getId()) || solvedQuestionIds.contains(qIdStr) || solvedQuestionIds.contains(String.valueOf(q.getQuestionNumber()))) {
                    String diff = q.getDifficulty().toLowerCase();
                    if (diff.equals("easy")) easyCount++;
                    else if (diff.equals("medium")) mediumCount++;
                    else if (diff.equals("hard")) hardCount++;
                }
            }

            List<Map<String, Object>> breakdown = new ArrayList<>();
            breakdown.add(Map.of("name", "Easy", "value", easyCount, "color", "#10B981"));
            breakdown.add(Map.of("name", "Medium", "value", mediumCount, "color", "#F59E0B"));
            breakdown.add(Map.of("name", "Hard", "value", hardCount, "color", "#EF4444"));

            Map<String, Object> response = new HashMap<>();
            response.put("successRate", successRate);
            response.put("totalAttempts", totalAttempts);
            response.put("solvedCount", successfulAttempts);
            response.put("difficultyBreakdown", breakdown);
            response.put("contributions", contributionData);
            response.put("highestStreak", user.getHighestStreak());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to compile analytics"));
        }
    }
}
