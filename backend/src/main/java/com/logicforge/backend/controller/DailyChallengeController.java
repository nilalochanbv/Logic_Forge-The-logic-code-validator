package com.logicforge.backend.controller;

import com.logicforge.backend.config.JwtFilter;
import com.logicforge.backend.model.Activity;
import com.logicforge.backend.model.Question;
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
@RequestMapping("/api/daily-challenge")
public class DailyChallengeController {

    @Autowired
    private DatabaseService databaseService;

    @Autowired
    private AIService aiService;

    private static final List<Question> DAILY_POOL = new ArrayList<>();

    static {
        // 1. Two Sum Logic
        Question q1 = new Question();
        q1.setId("daily_1");
        q1.setQuestionNumber(901);
        q1.setTitle("Two Sum Logic");
        q1.setDifficulty("easy");
        q1.setDescription("Given a list of numbers and a target sum, determine if there are two numbers in the list that add up exactly to the target sum.");
        q1.getInputExamples().add(new Question.InputExample("List: [2, 7, 11, 15], Target: 9", "Result: True (indices 0 and 1)"));
        q1.getConstraints().add("Each input value can be used at most once");
        q1.getConstraints().add("List can contain positive, negative or duplicate values");
        q1.getHints().add("You can compare each number with every other number in the list.");
        q1.getHints().add("For each index i, run another loop for index j starting from i+1.");
        q1.getHints().add("Check if list[i] + list[j] equals the target.");
        q1.getHints().add("If yes, return true or display the indices.");
        q1.getTags().addAll(Arrays.asList("arrays", "search"));
        DAILY_POOL.add(q1);

        // 2. Leap Year Checker
        Question q2 = new Question();
        q2.setId("daily_2");
        q2.setQuestionNumber(902);
        q2.setTitle("Leap Year Checker");
        q2.setDifficulty("easy");
        q2.setDescription("Write the logic to determine if a given year is a leap year. A year is a leap year if it is divisible by 4, but if it is divisible by 100 it is NOT a leap year, UNLESS it is also divisible by 400.");
        q2.getInputExamples().add(new Question.InputExample("Year: 2020", "Leap Year: True"));
        q2.getInputExamples().add(new Question.InputExample("Year: 1900", "Leap Year: False"));
        q2.getConstraints().add("Year is a positive integer greater than 0");
        q2.getHints().add("Check if the year is divisible by 4 first.");
        q2.getHints().add("If it is, check if it's divisible by 100. If it is, check if it's divisible by 400.");
        q2.getHints().add("Otherwise, you can write nested IF/ELSE conditions or combine them with AND/OR logic.");
        q2.getTags().addAll(Arrays.asList("math", "conditionals"));
        DAILY_POOL.add(q2);

        // 3. Decimal to Binary
        Question q3 = new Question();
        q3.setId("daily_3");
        q3.setQuestionNumber(903);
        q3.setTitle("Decimal to Binary");
        q3.setDifficulty("medium");
        q3.setDescription("Write the logical steps to convert a positive decimal integer into its binary equivalent represented as a string of bits.");
        q3.getInputExamples().add(new Question.InputExample("Decimal: 13", "Binary: '1101'"));
        q3.getConstraints().add("Input is a whole number greater than or equal to 0");
        q3.getHints().add("Repeatedly divide the decimal number by 2.");
        q3.getHints().add("In each division step, record the remainder (0 or 1).");
        q3.getHints().add("Continue dividing the quotient by 2 until the quotient becomes 0.");
        q3.getHints().add("The final binary string is the list of remainders read in reverse order.");
        q3.getTags().addAll(Arrays.asList("math", "binary"));
        DAILY_POOL.add(q3);

        // 4. Matrix Transposition
        Question q4 = new Question();
        q4.setId("daily_4");
        q4.setQuestionNumber(904);
        q4.setTitle("Matrix Transposition");
        q4.setDifficulty("medium");
        q4.setDescription("Transpose a given M x N matrix, swapping its rows with its columns.");
        q4.getInputExamples().add(new Question.InputExample("Matrix: [[1, 2], [3, 4]]", "Transposed: [[1, 3], [2, 4]]"));
        q4.getConstraints().add("Works for any grid size (M rows, N columns)");
        q4.getHints().add("Create a new empty matrix with dimensions N rows and M columns.");
        q4.getHints().add("Loop through each row index 'i' from 0 to M-1.");
        q4.getHints().add("Loop through each column index 'j' from 0 to N-1.");
        q4.getHints().add("Set the cell at position (j, i) in the new matrix to the value at (i, j) in the original matrix.");
        q4.getTags().addAll(Arrays.asList("matrices", "arrays"));
        DAILY_POOL.add(q4);

        // 5. Find Duplicate in List
        Question q5 = new Question();
        q5.setId("daily_5");
        q5.setQuestionNumber(905);
        q5.setTitle("Find Duplicate in List");
        q5.setDifficulty("easy");
        q5.setDescription("Identify if any value appears more than once in a given list of numbers.");
        q5.getInputExamples().add(new Question.InputExample("List: [1, 3, 4, 2, 2]", "Duplicate Found: True"));
        q5.getInputExamples().add(new Question.InputExample("List: [1, 2, 3, 4]", "Duplicate Found: False"));
        q5.getConstraints().add("The list is unsorted and contains integers");
        q5.getHints().add("Compare each element in the list with all other elements.");
        q5.getHints().add("Alternatively, use a collection (like a set or hash table) of 'seen' numbers.");
        q5.getHints().add("Loop through elements: if an element is in 'seen', return true. Otherwise, add it to 'seen' and continue.");
        q5.getTags().addAll(Arrays.asList("arrays", "duplicates"));
        DAILY_POOL.add(q5);

        // 6. Bubble Sort Single Pass
        Question q6 = new Question();
        q6.setId("daily_6");
        q6.setQuestionNumber(906);
        q6.setTitle("Bubble Sort Single Pass");
        q6.setDifficulty("medium");
        q6.setDescription("Describe the logic for performing a single full pass of the Bubble Sort algorithm over a list of numbers.");
        q6.getInputExamples().add(new Question.InputExample("List: [5, 1, 4, 2, 8]", "After Pass: [1, 4, 2, 5, 8]"));
        q6.getConstraints().add("Must iterate through the list comparing adjacent items up to the second-to-last item");
        q6.getHints().add("Loop index 'i' from 0 to length - 2.");
        q6.getHints().add("Compare list[i] with list[i+1].");
        q6.getHints().add("If list[i] is greater than list[i+1], swap their positions.");
        q6.getHints().add("Continue this process until you reach index length - 2.");
        q6.getTags().addAll(Arrays.asList("sorting", "algorithms"));
        DAILY_POOL.add(q6);

        // 7. Reverse Word Order
        Question q7 = new Question();
        q7.setId("daily_7");
        q7.setQuestionNumber(907);
        q7.setTitle("Reverse Word Order");
        q7.setDifficulty("medium");
        q7.setDescription("Reverse the order of words in a given sentence while keeping the characters in each word unchanged.");
        q7.getInputExamples().add(new Question.InputExample("Sentence: 'Logic Forge Rocks'", "Reversed: 'Rocks Forge Logic'"));
        q7.getConstraints().add("Words are separated by single spaces");
        q7.getHints().add("Split the sentence into a list of words by identifying space characters.");
        q7.getHints().add("Create a new list for output.");
        q7.getHints().add("Iterate through the split words in reverse order (from last index to first index) and add them to the output list.");
        q7.getHints().add("Join the output list with spaces and return it.");
        q7.getTags().addAll(Arrays.asList("strings", "parsing"));
        DAILY_POOL.add(q7);
    }

    @GetMapping
    public ResponseEntity<?> getDailyChallenge() {
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

            Calendar cal = Calendar.getInstance();
            int dayIndex = cal.get(Calendar.DAY_OF_MONTH) % DAILY_POOL.size();
            Question dailyChallenge = DAILY_POOL.get(dayIndex);

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            String todayStr = sdf.format(new Date());
            boolean solvedToday = todayStr.equals(user.getLastDailySolvedDate());

            Map<String, Object> response = new HashMap<>();
            response.put("question", dailyChallenge);
            response.put("dailyStreak", user.getDailyStreak());
            response.put("solvedToday", solvedToday);

            Map<String, Object> stats = new HashMap<>();
            stats.put("points", user.getPoints());
            stats.put("currentStreak", user.getCurrentStreak());
            stats.put("highestStreak", user.getHighestStreak());
            stats.put("badges", user.getBadges());
            response.put("stats", stats);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to fetch daily challenge"));
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitDailyChallenge(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> logicSteps = (List<String>) body.get("logicSteps");

        if (logicSteps == null) {
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

            Calendar cal = Calendar.getInstance();
            int dayIndex = cal.get(Calendar.DAY_OF_MONTH) % DAILY_POOL.size();
            Question dailyChallenge = DAILY_POOL.get(dayIndex);

            Map<String, Object> evaluation = aiService.evaluateLogic(dailyChallenge.getTitle(), logicSteps);
            String status = (String) evaluation.get("correctnessStatus");

            int pointsAwarded = 0;
            int newDailyStreak = user.getDailyStreak();
            boolean dailyStreakUpdated = false;

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            String todayStr = sdf.format(new Date());

            if ("correct".equalsIgnoreCase(status)) {
                pointsAwarded += 25; // 25 points flat for daily challenge

                if (!todayStr.equals(user.getLastDailySolvedDate())) {
                    String lastSolvedStr = user.getLastDailySolvedDate();
                    
                    if (lastSolvedStr == null) {
                        newDailyStreak = 1;
                    } else {
                        Calendar yesterdayCal = Calendar.getInstance();
                        yesterdayCal.add(Calendar.DATE, -1);
                        String yesterdayStr = sdf.format(yesterdayCal.getTime());

                        if (lastSolvedStr.equals(yesterdayStr)) {
                            newDailyStreak += 1;
                        } else {
                            newDailyStreak = 1;
                        }
                    }
                    dailyStreakUpdated = true;
                }

                User updatedUser = databaseService.updateUserDailyStreak(
                        user.getId(),
                        pointsAwarded,
                        newDailyStreak,
                        todayStr
                );

                // Activity logs
                databaseService.createActivity(new Activity(
                        user.getId(),
                        todayStr,
                        "solve",
                        String.format("Solved Daily Challenge: %s (+25 PTS)", dailyChallenge.getTitle())
                ));

                if (dailyStreakUpdated) {
                    databaseService.createActivity(new Activity(
                            user.getId(),
                            todayStr,
                            "streak_bonus",
                            String.format("Daily Challenge Streak Updated (+25 Points, Daily Streak: %d Days)", newDailyStreak)
                    ));
                }

                Map<String, Object> response = new HashMap<>();
                response.put("evaluation", evaluation);
                response.put("pointsAwarded", pointsAwarded);
                response.put("dailyStreak", newDailyStreak);
                response.put("solvedToday", true);

                Map<String, Object> userRes = new HashMap<>();
                userRes.put("points", updatedUser.getPoints());
                userRes.put("currentStreak", updatedUser.getCurrentStreak());
                userRes.put("highestStreak", updatedUser.getHighestStreak());
                userRes.put("badges", updatedUser.getBadges());
                userRes.put("dailyStreak", updatedUser.getDailyStreak());
                userRes.put("lastDailySolvedDate", updatedUser.getLastDailySolvedDate());
                response.put("user", userRes);

                return ResponseEntity.ok(response);
            } else {
                // Log failed attempt
                databaseService.createActivity(new Activity(
                        user.getId(),
                        todayStr,
                        "attempt",
                        String.format("Attempted Daily Challenge: %s", dailyChallenge.getTitle())
                ));

                Map<String, Object> response = new HashMap<>();
                response.put("evaluation", evaluation);
                response.put("pointsAwarded", 0);
                response.put("dailyStreak", newDailyStreak);
                response.put("solvedToday", todayStr.equals(user.getLastDailySolvedDate()));

                Map<String, Object> userRes = new HashMap<>();
                userRes.put("points", user.getPoints());
                userRes.put("currentStreak", user.getCurrentStreak());
                userRes.put("highestStreak", user.getHighestStreak());
                userRes.put("badges", user.getBadges());
                userRes.put("dailyStreak", user.getDailyStreak());
                userRes.put("lastDailySolvedDate", user.getLastDailySolvedDate());
                response.put("user", userRes);

                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to process daily challenge submission"));
        }
    }
}
