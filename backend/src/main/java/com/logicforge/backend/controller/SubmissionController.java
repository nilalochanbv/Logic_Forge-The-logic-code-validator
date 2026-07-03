package com.logicforge.backend.controller;

import com.logicforge.backend.config.JwtFilter;
import com.logicforge.backend.model.Activity;
import com.logicforge.backend.model.Question;
import com.logicforge.backend.model.Submission;
import com.logicforge.backend.model.User;
import com.logicforge.backend.service.AIService;
import com.logicforge.backend.service.DatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    @Autowired
    private DatabaseService databaseService;

    @Autowired
    private AIService aiService;

    @PostMapping
    public ResponseEntity<?> submitLogic(@RequestBody Map<String, Object> body) {
        String questionId = (String) body.get("questionId");
        
        @SuppressWarnings("unchecked")
        List<String> logicSteps = (List<String>) body.get("logicSteps");

        if (questionId == null || logicSteps == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid submission format"));
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

            Question question = databaseService.getQuestionById(questionId).orElse(null);
            if (question == null) {
                // Try fetching by questionNumber if questionId is a number string
                try {
                    int qNum = Integer.parseInt(questionId);
                    question = databaseService.getQuestionByNumber(qNum).orElse(null);
                } catch (NumberFormatException ignored) {}
            }

            if (question == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Question not found"));
            }

            // Evaluate steps
            Map<String, Object> evaluation = aiService.evaluateLogic(question.getTitle(), logicSteps);
            String status = (String) evaluation.get("correctnessStatus");
            int score = ((Number) evaluation.get("logicQualityScore")).intValue();
            int stars = ((Number) evaluation.get("stars")).intValue();
            String explanation = (String) evaluation.get("explanation");

            int pointsAwarded = 0;
            if ("correct".equalsIgnoreCase(status)) {
                pointsAwarded += Math.round(score / 2.0);
            }

            // Streak calculations
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            String todayStr = sdf.format(new Date());
            
            int streakBonus = 0;
            int newStreak = user.getCurrentStreak();
            boolean streakUpdated = false;

            // Check if solved today
            List<Activity> userActivities = databaseService.getActivitiesByUserId(user.getId());
            boolean solvedToday = false;
            for (Activity a : userActivities) {
                if (todayStr.equals(a.getDate()) && "solve".equalsIgnoreCase(a.getType())) {
                    solvedToday = true;
                    break;
                }
            }

            if ("correct".equalsIgnoreCase(status) && !solvedToday) {
                streakBonus = 10;
                pointsAwarded += streakBonus;

                Date lastActive = user.getLastActiveDate();
                if (lastActive == null) {
                    newStreak = 1;
                } else {
                    String lastActiveStr = sdf.format(lastActive);
                    if (lastActiveStr.equals(todayStr)) {
                        if (newStreak == 0) newStreak = 1;
                    } else {
                        Calendar cal = Calendar.getInstance();
                        cal.setTime(new Date());
                        cal.add(Calendar.DATE, -1);
                        String yesterdayStr = sdf.format(cal.getTime());

                        if (lastActiveStr.equals(yesterdayStr)) {
                            newStreak += 1;
                        } else {
                            newStreak = 1;
                        }
                    }
                }
                streakUpdated = true;
            }

            int newHighestStreak = Math.max(user.getHighestStreak(), newStreak);

            // Badge validation
            Map<String, Integer> badgeRequirements = new LinkedHashMap<>();
            badgeRequirements.put("iron_age", 10);
            badgeRequirements.put("bronze", 25);
            badgeRequirements.put("silver", 50);
            badgeRequirements.put("gold", 100);
            badgeRequirements.put("platinum", 150);
            badgeRequirements.put("diamond", 200);
            badgeRequirements.put("master", 250);
            badgeRequirements.put("grand_master", 350);
            badgeRequirements.put("titan", 500);

            String newlyEarnedBadge = null;
            for (Map.Entry<String, Integer> entry : badgeRequirements.entrySet()) {
                if (newHighestStreak >= entry.getValue()) {
                    boolean alreadyEarned = user.getBadges().stream()
                            .anyMatch(b -> b.getBadgeId().equals(entry.getKey()));
                    if (!alreadyEarned) {
                        newlyEarnedBadge = entry.getKey();
                    }
                }
            }

            // Create submission
            Submission submission = new Submission();
            submission.setUserId(user.getId());
            submission.setQuestionId(question.getId() != null ? question.getId() : String.valueOf(question.getQuestionNumber()));
            submission.setLogicSubmitted(logicSteps);
            submission.setAiFeedback(explanation);
            submission.setStars(stars);
            submission.setCorrectnessStatus(status);
            submission.setPointsAwarded(pointsAwarded);
            
            Submission savedSubmission = databaseService.createSubmission(submission);

            // Update user progress
            Map<String, Integer> streakUpdate = new HashMap<>();
            streakUpdate.put("currentStreak", newStreak);
            streakUpdate.put("highestStreak", newHighestStreak);

            User updatedUser = databaseService.updateUserProgress(
                    user.getId(),
                    pointsAwarded,
                    streakUpdate,
                    "correct".equalsIgnoreCase(status) ? new Date() : null,
                    newlyEarnedBadge
            );

            // Activity Logging
            if ("correct".equalsIgnoreCase(status)) {
                databaseService.createActivity(new Activity(
                        user.getId(),
                        todayStr,
                        "solve",
                        String.format("Solved problem: %s (%d Stars)", question.getTitle(), stars)
                ));
                if (streakBonus > 0) {
                    databaseService.createActivity(new Activity(
                            user.getId(),
                            todayStr,
                            "streak_bonus",
                            String.format("Daily Streak Solve Reward (+10 Points, Streak: %d Days)", newStreak)
                    ));
                }
            } else {
                databaseService.createActivity(new Activity(
                        user.getId(),
                        todayStr,
                        "attempt",
                        String.format("Attempted problem: %s", question.getTitle())
                ));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("submission", savedSubmission);
            response.put("evaluation", evaluation);
            response.put("pointsAwarded", pointsAwarded);
            response.put("newStreak", newStreak);
            response.put("streakUpdated", streakUpdated);
            response.put("newBadge", newlyEarnedBadge);
            
            Map<String, Object> userRes = new HashMap<>();
            userRes.put("points", updatedUser.getPoints());
            userRes.put("currentStreak", updatedUser.getCurrentStreak());
            userRes.put("highestStreak", updatedUser.getHighestStreak());
            userRes.put("badges", updatedUser.getBadges());
            response.put("user", userRes);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to process submission"));
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> getUserSubmissions() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof JwtFilter.UserPrincipal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        JwtFilter.UserPrincipal userPrincipal = (JwtFilter.UserPrincipal) principal;

        try {
            List<Submission> submissions = databaseService.getSubmissionsByUserId(userPrincipal.getId());
            return ResponseEntity.ok(submissions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to fetch submission history"));
        }
    }
}
