package com.logicforge.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logicforge.backend.model.Activity;
import com.logicforge.backend.model.Question;
import com.logicforge.backend.model.Submission;
import com.logicforge.backend.model.User;
import com.logicforge.backend.repository.ActivityRepository;
import com.logicforge.backend.repository.QuestionRepository;
import com.logicforge.backend.repository.SubmissionRepository;
import com.logicforge.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.util.*;

@Service
public class DatabaseService {

    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired(required = false)
    private QuestionRepository questionRepository;

    @Autowired(required = false)
    private SubmissionRepository submissionRepository;

    @Autowired(required = false)
    private ActivityRepository activityRepository;

    private boolean isFallbackMode = false;
    private File fallbackFile;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Fallback Database structure
    private static class FallbackDb {
        public List<User> users = new ArrayList<>();
        public List<Question> questions = new ArrayList<>();
        public List<Submission> submissions = new ArrayList<>();
        public List<Activity> activities = new ArrayList<>();
    }

    private FallbackDb db = new FallbackDb();

    @PostConstruct
    public void init() {
        String mongoUri = System.getProperty("MONGODB_URI");
        if (mongoUri == null || mongoUri.trim().isEmpty() || userRepository == null) {
            System.out.println("Starting in JSON Fallback Mode.");
            isFallbackMode = true;
            resolveFallbackFile();
            loadFallbackDb();
        } else {
            try {
                // Test connection by counting questions
                questionRepository.count();
                System.out.println("Successfully connected to MongoDB!");
                seedQuestionsInMongo();
            } catch (Exception e) {
                System.err.println("MongoDB connection failed! Switching to JSON Fallback Mode. Error: " + e.getMessage());
                isFallbackMode = true;
                resolveFallbackFile();
                loadFallbackDb();
            }
        }
    }

    private void resolveFallbackFile() {
        // Look for existing db_fallback.json in ../backend/data, backend/data, or local data/
        File[] possibleFiles = {
            new File("../backend/data/db_fallback.json"),
            new File("backend/data/db_fallback.json"),
            new File("data/db_fallback.json")
        };

        for (File f : possibleFiles) {
            if (f.exists()) {
                fallbackFile = f;
                System.out.println("Found existing JSON database at: " + f.getAbsolutePath());
                return;
            }
        }

        // Fallback default: create inside parent's backend directory if possible, else locally
        File parentBackendData = new File("../backend/data");
        if (parentBackendData.exists() && parentBackendData.isDirectory()) {
            fallbackFile = new File(parentBackendData, "db_fallback.json");
        } else {
            File localData = new File("data");
            if (!localData.exists()) {
                localData.mkdirs();
            }
            fallbackFile = new File(localData, "db_fallback.json");
        }
        System.out.println("Configured fallback database path to: " + fallbackFile.getAbsolutePath());
    }

    private synchronized void loadFallbackDb() {
        if (fallbackFile.exists()) {
            try {
                db = objectMapper.readValue(fallbackFile, FallbackDb.class);
                System.out.println("Loaded fallback database containing " + db.users.size() + " users, " 
                    + db.questions.size() + " questions, and " + db.submissions.size() + " submissions.");
            } catch (IOException e) {
                System.err.println("Failed to parse JSON database: " + e.getMessage());
                initializeEmptyFallbackDb();
            }
        } else {
            initializeEmptyFallbackDb();
        }
    }

    private void initializeEmptyFallbackDb() {
        System.out.println("Creating new local database file with preloaded logic challenges.");
        db = new FallbackDb();
        db.questions = generateAllQuestions();
        saveFallbackDb();
    }

    private synchronized void saveFallbackDb() {
        try {
            // Ensure parent directory exists
            File parent = fallbackFile.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(fallbackFile, db);
        } catch (IOException e) {
            System.err.println("Failed to write to JSON database: " + e.getMessage());
        }
    }

    private void seedQuestionsInMongo() {
        try {
            if (questionRepository.count() == 0) {
                System.out.println("Seeding MongoDB with programming logic questions...");
                List<Question> seeded = generateAllQuestions();
                questionRepository.saveAll(seeded);
                System.out.println("MongoDB seeded with " + seeded.size() + " questions.");
            }
        } catch (Exception e) {
            System.err.println("Failed to seed MongoDB questions: " + e.getMessage());
        }
    }

    public boolean isFallback() {
        return isFallbackMode;
    }

    // --- USER CRUD ---
    public Optional<User> getUserByEmail(String email) {
        if (isFallbackMode) {
            return db.users.stream()
                .filter(u -> u.getEmail().equalsIgnoreCase(email))
                .findFirst();
        }
        return userRepository.findByEmail(email);
    }

    public Optional<User> getUserById(String id) {
        if (isFallbackMode) {
            return db.users.stream()
                .filter(u -> u.getId().equals(id))
                .findFirst();
        }
        return userRepository.findById(id);
    }

    public User createUser(User user) {
        if (isFallbackMode) {
            if (user.getId() == null) {
                user.setId("user_" + UUID.randomUUID().toString().replace("-", "").substring(0, 9));
            }
            db.users.add(user);
            saveFallbackDb();
            return user;
        }
        return userRepository.save(user);
    }

    public User saveUser(User user) {
        if (isFallbackMode) {
            for (int i = 0; i < db.users.size(); i++) {
                if (db.users.get(i).getId().equals(user.getId())) {
                    db.users.set(i, user);
                    break;
                }
            }
            saveFallbackDb();
            return user;
        }
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        if (isFallbackMode) {
            return db.users;
        }
        return userRepository.findAll();
    }

    // --- QUESTION CRUD ---
    public List<Question> getQuestions() {
        if (isFallbackMode) {
            return db.questions;
        }
        List<Question> q = questionRepository.findAll();
        q.sort(Comparator.comparingInt(Question::getQuestionNumber));
        return q;
    }

    public Optional<Question> getQuestionByNumber(int num) {
        if (isFallbackMode) {
            return db.questions.stream()
                .filter(q -> q.getQuestionNumber() == num)
                .findFirst();
        }
        return questionRepository.findByQuestionNumber(num);
    }

    public Optional<Question> getQuestionById(String id) {
        if (isFallbackMode) {
            return db.questions.stream()
                .filter(q -> q.getId().equals(id))
                .findFirst();
        }
        return questionRepository.findById(id);
    }

    public Question createQuestion(Question q) {
        if (isFallbackMode) {
            if (q.getId() == null) {
                q.setId("q_" + UUID.randomUUID().toString().replace("-", "").substring(0, 9));
            }
            db.questions.add(q);
            db.questions.sort(Comparator.comparingInt(Question::getQuestionNumber));
            saveFallbackDb();
            return q;
        }
        return questionRepository.save(q);
    }

    // --- SUBMISSION CRUD ---
    public List<Submission> getSubmissions() {
        if (isFallbackMode) {
            return db.submissions;
        }
        return submissionRepository.findAll();
    }

    public List<Submission> getSubmissionsByUserId(String userId) {
        if (isFallbackMode) {
            List<Submission> list = new ArrayList<>();
            for (Submission s : db.submissions) {
                if (s.getUserId().equals(userId)) {
                    list.add(s);
                }
            }
            return list;
        }
        return submissionRepository.findByUserId(userId);
    }

    public Submission createSubmission(Submission s) {
        if (isFallbackMode) {
            if (s.getId() == null) {
                s.setId("sub_" + UUID.randomUUID().toString().replace("-", "").substring(0, 9));
            }
            db.submissions.add(s);
            saveFallbackDb();
            return s;
        }
        return submissionRepository.save(s);
    }

    // --- ACTIVITY CRUD ---
    public List<Activity> getActivitiesByUserId(String userId) {
        if (isFallbackMode) {
            List<Activity> list = new ArrayList<>();
            for (Activity a : db.activities) {
                if (a.getUserId().equals(userId)) {
                    list.add(a);
                }
            }
            return list;
        }
        return activityRepository.findByUserId(userId);
    }

    public Activity createActivity(Activity a) {
        if (isFallbackMode) {
            if (a.getId() == null) {
                a.setId("act_" + UUID.randomUUID().toString().replace("-", "").substring(0, 9));
            }
            db.activities.add(a);
            saveFallbackDb();
            return a;
        }
        return activityRepository.save(a);
    }

    public User updateUserProgress(String userId, int pointsToAdd, Map<String, Integer> streakUpdate, Date lastActiveDate, String badgeToEarn) {
        User user = getUserById(userId).orElse(null);
        if (user != null) {
            user.setPoints(user.getPoints() + pointsToAdd);
            if (streakUpdate.containsKey("currentStreak")) {
                user.setCurrentStreak(streakUpdate.get("currentStreak"));
            }
            if (streakUpdate.containsKey("highestStreak")) {
                user.setHighestStreak(Math.max(user.getHighestStreak(), streakUpdate.get("highestStreak")));
            }
            if (lastActiveDate != null) {
                user.setLastActiveDate(lastActiveDate);
            }
            if (badgeToEarn != null) {
                boolean hasBadge = user.getBadges().stream().anyMatch(b -> b.getBadgeId().equals(badgeToEarn));
                if (!hasBadge) {
                    user.getBadges().add(new com.logicforge.backend.model.Badge(badgeToEarn, new Date()));
                }
            }
            return saveUser(user);
        }
        return null;
    }

    public User updateUserDailyStreak(String userId, int pointsToAdd, int newDailyStreak, String todayStr) {
        User user = getUserById(userId).orElse(null);
        if (user != null) {
            user.setPoints(user.getPoints() + pointsToAdd);
            user.setDailyStreak(newDailyStreak);
            user.setLastDailySolvedDate(todayStr);
            return saveUser(user);
        }
        return null;
    }

    public User updateUserRole(String userId, String role) {
        User user = getUserById(userId).orElse(null);
        if (user != null) {
            user.setRole(role);
            return saveUser(user);
        }
        return null;
    }

    public Question updateQuestion(String id, Question qData) {
        Question question = getQuestionById(id).orElse(null);
        if (question != null) {
            if (qData.getTitle() != null) question.setTitle(qData.getTitle());
            if (qData.getDifficulty() != null) question.setDifficulty(qData.getDifficulty());
            if (qData.getDescription() != null) question.setDescription(qData.getDescription());
            if (qData.getInputExamples() != null) question.setInputExamples(qData.getInputExamples());
            if (qData.getConstraints() != null) question.setConstraints(qData.getConstraints());
            if (qData.getHints() != null) question.setHints(qData.getHints());
            if (qData.getTags() != null) question.setTags(qData.getTags());
            
            if (isFallbackMode) {
                for (int i = 0; i < db.questions.size(); i++) {
                    if (db.questions.get(i).getId().equals(id)) {
                        db.questions.set(i, question);
                        break;
                    }
                }
                saveFallbackDb();
                return question;
            }
            return questionRepository.save(question);
        }
        return null;
    }

    public Question deleteQuestion(String id) {
        Question question = getQuestionById(id).orElse(null);
        if (question != null) {
            if (isFallbackMode) {
                db.questions.removeIf(q -> q.getId().equals(id));
                saveFallbackDb();
                return question;
            }
            questionRepository.delete(question);
            return question;
        }
        return null;
    }

    // --- QUESTIONS GENERATOR (1800 Total) ---
    private List<Question> generateAllQuestions() {
        List<Question> list = new ArrayList<>();
        int qNum = 1;

        // 1. Sum Of Two Numbers
        Question q1 = new Question();
        q1.setId("q_1");
        q1.setQuestionNumber(qNum++);
        q1.setTitle("Sum Of Two Numbers");
        q1.setDifficulty("easy");
        q1.setDescription("Write the logical steps to calculate the sum of two numbers input by a user.");
        q1.getInputExamples().add(new Question.InputExample("First number: 5, Second number: 10", "Sum: 15"));
        q1.getInputExamples().add(new Question.InputExample("First number: -3, Second number: 8", "Sum: 5"));
        q1.getConstraints().add("Must work for negative numbers");
        q1.getConstraints().add("Must accept decimal values if input");
        q1.getHints().add("Start by prompting the user for input.");
        q1.getHints().add("You need to store the two values in memory slots or labels before adding them.");
        q1.getHints().add("The final step should display the calculated sum.");
        q1.getTags().addAll(Arrays.asList("arithmetic", "basic"));
        list.add(q1);

        // 2. Even Or Odd
        Question q2 = new Question();
        q2.setId("q_2");
        q2.setQuestionNumber(qNum++);
        q2.setTitle("Even Or Odd");
        q2.setDifficulty("easy");
        q2.setDescription("Determine if a given integer is even or odd.");
        q2.getInputExamples().add(new Question.InputExample("Number: 4", "Output: Even"));
        q2.getInputExamples().add(new Question.InputExample("Number: 7", "Output: Odd"));
        q2.getConstraints().add("The input is a single whole number");
        q2.getConstraints().add("Must handle zero correctly");
        q2.getHints().add("How do we mathematically check if a number is divisible by 2?");
        q2.getHints().add("Think about using the remainder after division.");
        q2.getHints().add("You need conditional logic: IF remainder is 0, it's even; ELSE, it's odd.");
        q2.getTags().addAll(Arrays.asList("conditionals", "arithmetic"));
        list.add(q2);

        // 3. Largest Of Three Numbers
        Question q3 = new Question();
        q3.setId("q_3");
        q3.setQuestionNumber(qNum++);
        q3.setTitle("Largest Of Three Numbers");
        q3.setDifficulty("easy");
        q3.setDescription("Find the largest of three given numbers.");
        q3.getInputExamples().add(new Question.InputExample("Numbers: 12, 45, 23", "Largest: 45"));
        q3.getInputExamples().add(new Question.InputExample("Numbers: -5, -1, -10", "Largest: -1"));
        q3.getConstraints().add("Works for any positive or negative values");
        q3.getConstraints().add("Assume all three numbers are unique for simplicity");
        q3.getHints().add("You need to compare them one by one or in combinations.");
        q3.getHints().add("Try checking if the first number is greater than both the second and third.");
        q3.getHints().add("You can use nested logic or compound conditions (AND operations).");
        q3.getTags().addAll(Arrays.asList("logic", "conditionals"));
        list.add(q3);

        // 4. Prime Number Verification
        Question q4 = new Question();
        q4.setId("q_4");
        q4.setQuestionNumber(qNum++);
        q4.setTitle("Prime Number Verification");
        q4.setDifficulty("medium");
        q4.setDescription("Check if a given number is a prime number (divisible only by 1 and itself).");
        q4.getInputExamples().add(new Question.InputExample("Number: 7", "Output: Prime"));
        q4.getInputExamples().add(new Question.InputExample("Number: 9", "Output: Not Prime"));
        q4.getConstraints().add("Input is an integer greater than 1");
        q4.getConstraints().add("Must correctly identify 2 as prime and 4 as not prime");
        q4.getHints().add("A prime number cannot be divided evenly by any number between 2 and the number minus 1.");
        q4.getHints().add("Use a loop to check divisibility sequentially.");
        q4.getHints().add("If you find any number that divides it evenly, stop checking and declare it not prime.");
        q4.getTags().addAll(Arrays.asList("loops", "divisibility"));
        list.add(q4);

        // 5. Palindrome Verification
        Question q5 = new Question();
        q5.setId("q_5");
        q5.setQuestionNumber(qNum++);
        q5.setTitle("Palindrome Verification");
        q5.setDifficulty("medium");
        q5.setDescription("Check if a given word or sequence of digits reads the same backwards as forwards (e.g. 'radar' or 12321).");
        q5.getInputExamples().add(new Question.InputExample("Input: 'radar'", "Output: Palindrome"));
        q5.getInputExamples().add(new Question.InputExample("Input: 'hello'", "Output: Not Palindrome"));
        q5.getConstraints().add("Case insensitive verification");
        q5.getConstraints().add("Ignore spaces if necessary");
        q5.getHints().add("You need to reverse the input value first, or compare characters from both ends.");
        q5.getHints().add("If comparing from both ends, repeat until you meet in the middle.");
        q5.getHints().add("If any mismatch is found, it is not a palindrome.");
        q5.getTags().addAll(Arrays.asList("strings", "loops"));
        list.add(q5);

        // 6. Reverse a Number
        Question q6 = new Question();
        q6.setId("q_6");
        q6.setQuestionNumber(qNum++);
        q6.setTitle("Reverse a Number");
        q6.setDifficulty("medium");
        q6.setDescription("Given a positive integer, reverse the order of its digits.");
        q6.getInputExamples().add(new Question.InputExample("Number: 1234", "Reversed: 4321"));
        q6.getInputExamples().add(new Question.InputExample("Number: 700", "Reversed: 7"));
        q6.getConstraints().add("Output should be a number, not just printed digits");
        q6.getConstraints().add("Remove leading zeroes in the result (e.g., 700 becomes 7)");
        q6.getHints().add("Think about how to isolate the last digit of a number using modulo 10.");
        q6.getHints().add("Multiply your accumulated result by 10 and add the digit.");
        q6.getHints().add("Divide the original number by 10 (keeping the integer part) to strip the last digit. Repeat.");
        q6.getTags().addAll(Arrays.asList("math", "loops"));
        list.add(q6);

        // 7. FizzBuzz Logic
        Question q7 = new Question();
        q7.setId("q_7");
        q7.setQuestionNumber(qNum++);
        q7.setTitle("FizzBuzz Logic");
        q7.setDifficulty("medium");
        q7.setDescription("Iterate from 1 to N. For multiples of 3, output 'Fizz'. For multiples of 5, output 'Buzz'. For multiples of both 3 and 5, output 'FizzBuzz'. Otherwise, output the number itself.");
        q7.getInputExamples().add(new Question.InputExample("N: 5", "Output: 1, 2, Fizz, 4, Buzz"));
        q7.getConstraints().add("Check 15 first (both divisibility rules) to avoid premature matches");
        q7.getHints().add("You need a loop that increments from 1 up to N.");
        q7.getHints().add("Evaluate the combined condition (multiple of 3 AND 5) before checking individual ones.");
        q7.getHints().add("Print or accumulate the outputs correctly.");
        q7.getTags().addAll(Arrays.asList("conditionals", "loops"));
        list.add(q7);

        // 8. Fibonacci Series
        Question q8 = new Question();
        q8.setId("q_8");
        q8.setQuestionNumber(qNum++);
        q8.setTitle("Fibonacci Series");
        q8.setDifficulty("hard");
        q8.setDescription("Generate the first N numbers of the Fibonacci sequence, where each number is the sum of the two preceding ones, starting from 0 and 1.");
        q8.getInputExamples().add(new Question.InputExample("N: 5", "Series: 0, 1, 1, 2, 3"));
        q8.getConstraints().add("N is a positive integer >= 1");
        q8.getHints().add("Initialize two variables with 0 and 1, as they are the first two numbers.");
        q8.getHints().add("Use a loop that runs N times.");
        q8.getHints().add("In each step, display the current value, calculate the next term as sum of the two previous terms, and slide your variables forward.");
        q8.getTags().addAll(Arrays.asList("loops", "sequences"));
        list.add(q8);

        // 9. Find Factorial
        Question q9 = new Question();
        q9.setId("q_9");
        q9.setQuestionNumber(qNum++);
        q9.setTitle("Find Factorial");
        q9.setDifficulty("easy");
        q9.setDescription("Calculate the product of all positive integers less than or equal to N (N!).");
        q9.getInputExamples().add(new Question.InputExample("N: 4", "Factorial: 24"));
        q9.getConstraints().add("N is a non-negative integer");
        q9.getConstraints().add("0! is defined as 1");
        q9.getHints().add("Start with a result variable set to 1.");
        q9.getHints().add("Run a loop from 1 to N, multiplying the result by the loop variable in each iteration.");
        q9.getHints().add("Output the final result after the loop completes.");
        q9.getTags().addAll(Arrays.asList("math", "loops"));
        list.add(q9);

        // 10. Find Smallest Number in List
        Question q10 = new Question();
        q10.setId("q_10");
        q10.setQuestionNumber(qNum++);
        q10.setTitle("Find Smallest Number in List");
        q10.setDifficulty("easy");
        q10.setDescription("Given a list of numbers, write the logic steps to find the smallest number in that list.");
        q10.getInputExamples().add(new Question.InputExample("List: [14, 5, 23, 2, 8]", "Smallest: 2"));
        q10.getConstraints().add("Must handle lists of any length greater than 0");
        q10.getConstraints().add("Must work for positive and negative numbers");
        q10.getHints().add("Assume the first number is the smallest to start.");
        q10.getHints().add("Loop through the rest of the numbers one by one.");
        q10.getHints().add("If you find a number smaller than your current smallest, update it.");
        q10.getHints().add("After checking all numbers, display the smallest value.");
        q10.getTags().addAll(Arrays.asList("loops", "arrays", "comparison"));
        list.add(q10);

        // 11. Celsius to Fahrenheit
        Question q11 = new Question();
        q11.setId("q_11");
        q11.setQuestionNumber(qNum++);
        q11.setTitle("Celsius to Fahrenheit");
        q11.setDifficulty("easy");
        q11.setDescription("Convert a temperature value given in Celsius to Fahrenheit using the formula: F = (C * 9/5) + 32.");
        q11.getInputExamples().add(new Question.InputExample("Celsius: 0", "Fahrenheit: 32"));
        q11.getInputExamples().add(new Question.InputExample("Celsius: 100", "Fahrenheit: 212"));
        q11.getConstraints().add("Input can be fractional values");
        q11.getConstraints().add("Should handle negative temperatures correctly");
        q11.getHints().add("Get the Celsius input temperature.");
        q11.getHints().add("Multiply the input by 9, then divide by 5.");
        q11.getHints().add("Add 32 to that calculated result.");
        q11.getHints().add("Display the final Fahrenheit value.");
        q11.getTags().addAll(Arrays.asList("math", "basic"));
        list.add(q11);

        // 12. Count Vowels in String
        Question q12 = new Question();
        q12.setId("q_12");
        q12.setQuestionNumber(qNum++);
        q12.setTitle("Count Vowels in String");
        q12.setDifficulty("easy");
        q12.setDescription("Count how many vowels (a, e, i, o, u) exist in a given English word or phrase.");
        q12.getInputExamples().add(new Question.InputExample("Text: 'LogicForge'", "Vowels: 4"));
        q12.getConstraints().add("Case-insensitive (both uppercase and lowercase vowels count)");
        q12.getConstraints().add("Spaces or special characters should be ignored");
        q12.getHints().add("Initialize a count variable to 0.");
        q12.getHints().add("Convert input to lowercase and loop through each character.");
        q12.getHints().add("Check if character is 'a', 'e', 'i', 'o', or 'u'. If yes, increment the count.");
        q12.getHints().add("Display the final count.");
        q12.getTags().addAll(Arrays.asList("strings", "loops", "search"));
        list.add(q12);

        // 13. Basic SQL: Fetch Active Users
        Question q13 = new Question();
        q13.setId("q_13");
        q13.setQuestionNumber(qNum++);
        q13.setTitle("Database Query: Active Users");
        q13.setDifficulty("easy");
        q13.setDescription("Write logical database instructions to fetch user records where status is set to active.");
        q13.getInputExamples().add(new Question.InputExample("Database contains 3 active, 2 inactive users", "Returns: 3 records"));
        q13.getConstraints().add("Specify the database columns to query");
        q13.getHints().add("Identify the target database table (e.g., Users).");
        q13.getHints().add("Filter the query using the status condition.");
        q13.getHints().add("Outline selecting required columns (e.g., id, username).");
        q13.getTags().addAll(Arrays.asList("database", "sql", "filter"));
        list.add(q13);

        // 14. Linear Search implementation
        Question q14 = new Question();
        q14.setId("q_14");
        q14.setQuestionNumber(qNum++);
        q14.setTitle("Linear Search");
        q14.setDifficulty("easy");
        q14.setDescription("Search for a target value in an array. Return its index if found, else return -1.");
        q14.getInputExamples().add(new Question.InputExample("Array: [4, 8, 15, 16], Target: 15", "Index: 2"));
        q14.getInputExamples().add(new Question.InputExample("Array: [4, 8, 15, 16], Target: 20", "Index: -1"));
        q14.getConstraints().add("Must loop through array elements sequentially");
        q14.getHints().add("Loop through array from index 0 to length - 1.");
        q14.getHints().add("Check if current element equals target. If yes, output current index and stop.");
        q14.getHints().add("If the loop finishes and no match is found, output -1.");
        q14.getTags().addAll(Arrays.asList("arrays", "search", "loops"));
        list.add(q14);

        // 15. Bubble Sort Mechanics
        Question q15 = new Question();
        q15.setId("q_15");
        q15.setQuestionNumber(qNum++);
        q15.setTitle("Bubble Sort");
        q15.setDifficulty("hard");
        q15.setDescription("Implement simple sorting of an array by repeatedly swapping adjacent elements that are in the wrong order.");
        q15.getInputExamples().add(new Question.InputExample("Input: [5, 1, 4, 2]", "Sorted: [1, 2, 4, 5]"));
        q15.getConstraints().add("Sort in ascending order");
        q15.getHints().add("Use nested loops to traverse the array.");
        q15.getHints().add("Compare adjacent elements: index i and i+1.");
        q15.getHints().add("If element at i is greater than i+1, swap them.");
        q15.getHints().add("Repeat this pass until no swaps are needed on a full traversal.");
        q15.getTags().addAll(Arrays.asList("sorting", "arrays", "loops"));
        list.add(q15);

        // 16. Shell Execution: File Counting
        Question q16 = new Question();
        q16.setId("q_16");
        q16.setQuestionNumber(qNum++);
        q16.setTitle("Shell Script: Count Text Files");
        q16.setDifficulty("easy");
        q16.setDescription("Write shell steps to list and count all files ending with a '.txt' extension in the current directory.");
        q16.getInputExamples().add(new Question.InputExample("Directory containing 3 .txt files, 2 others", "Count: 3"));
        q16.getConstraints().add("Do not count recursively");
        q16.getHints().add("List only files matching the *.txt wildcard pattern.");
        q16.getHints().add("Pipe the output to a word-counting utility (e.g. wc -l) to count lines.");
        q16.getTags().addAll(Arrays.asList("shell", "bash", "files"));
        list.add(q16);

        // 17. Shell Execution: Log Error Grep
        Question q17 = new Question();
        q17.setId("q_17");
        q17.setQuestionNumber(qNum++);
        q17.setTitle("Shell Script: Error Log Grep");
        q17.setDifficulty("medium");
        q17.setDescription("Write shell logic to search for lines containing the word 'ERROR' in a log file named 'server.log'.");
        q17.getInputExamples().add(new Question.InputExample("log contains 2 error lines", "Outputs: 2 error log lines"));
        q17.getConstraints().add("Output matched lines exactly");
        q17.getHints().add("Use the file search pattern matcher command (grep).");
        q17.getHints().add("Provide the target query string ('ERROR') and specify the file path ('server.log').");
        q17.getTags().addAll(Arrays.asList("shell", "grep", "search"));
        list.add(q17);

        // 18. Database Query: Join Users and Roles
        Question q18 = new Question();
        q18.setId("q_18");
        q18.setQuestionNumber(qNum++);
        q18.setTitle("Database Query: User Roles Join");
        q18.setDifficulty("medium");
        q18.setDescription("Write logical database instructions to fetch active users along with their role descriptions by joining the Users and Roles tables.");
        q18.getInputExamples().add(new Question.InputExample("Users joined to Roles", "Returns: joined dataset"));
        q18.getConstraints().add("Specify the matching key to join");
        q18.getHints().add("Perform an inner join between Users and Roles.");
        q18.getHints().add("Define the join condition matching the roleId primary/foreign keys.");
        q18.getHints().add("Filter the final dataset where status equals active.");
        q18.getTags().addAll(Arrays.asList("database", "sql", "join"));
        list.add(q18);

        // Generate Easy questions up to 600
        int easyCount = list.size();
        for (int i = easyCount + 1; i <= 600; i++) {
            int listSize = 5 + (i % 20);
            Question q = new Question();
            q.setId("q_" + qNum);
            q.setQuestionNumber(qNum++);
            q.setTitle("Array Sum Analysis #" + i);
            q.setDifficulty("easy");
            q.setDescription("Write the logic steps to calculate the sum of an array containing " + listSize + " numbers.");
            q.getInputExamples().add(new Question.InputExample("Array of size " + listSize + " with all values set to 2", "Sum: " + (listSize * 2)));
            q.getConstraints().add("Array elements can be positive or negative integers");
            q.getConstraints().add("Must run in linear time");
            q.getHints().add("Initialize a sum accumulator variable to 0.");
            q.getHints().add("Loop through the array from index 0 to length - 1.");
            q.getHints().add("Add the current element to the sum accumulator.");
            q.getHints().add("Output the accumulator value.");
            q.getTags().addAll(Arrays.asList("easy", "array", "sum"));
            list.add(q);
        }

        // Generate Medium questions up to 600
        int medCount = 0;
        for (Question q : list) {
            if (q.getDifficulty().equals("medium")) medCount++;
        }
        for (int i = medCount + 1; i <= 600; i++) {
            int decVal = 100 + i;
            Question q = new Question();
            q.setId("q_" + qNum);
            q.setQuestionNumber(qNum++);
            q.setTitle("Binary Conversion Challenge #" + i);
            q.setDifficulty("medium");
            q.setDescription("Write the logic steps to convert the decimal number " + decVal + " to its binary representation.");
            q.getInputExamples().add(new Question.InputExample("Decimal: " + decVal, "Binary: '" + Integer.toBinaryString(decVal) + "'"));
            q.getConstraints().add("Express steps in plain English");
            q.getConstraints().add("Explain subtraction or division checks clearly");
            q.getHints().add("Repeatedly divide the number by 2 and track the remainder.");
            q.getHints().add("Keep dividing the quotient until it becomes 0.");
            q.getHints().add("Display the remainders in reverse order.");
            q.getTags().addAll(Arrays.asList("medium", "math", "binary"));
            list.add(q);
        }

        // Generate Hard questions up to 600
        int hardCount = 0;
        for (Question q : list) {
            if (q.getDifficulty().equals("hard")) hardCount++;
        }
        for (int i = hardCount + 1; i <= 600; i++) {
            int disks = 3 + (i % 5);
            Question q = new Question();
            q.setId("q_" + qNum);
            q.setQuestionNumber(qNum++);
            q.setTitle("Tower of Hanoi Depth #" + i);
            q.setDifficulty("hard");
            q.setDescription("Write the recursive logic to solve the Tower of Hanoi puzzle for " + disks + " disks from rod A to rod C using auxiliary rod B.");
            q.getInputExamples().add(new Question.InputExample("Disks: " + disks + ", Rods: A (Source), C (Dest), B (Aux)", "Total moves: " + ((int) Math.pow(2, disks) - 1)));
            q.getConstraints().add("You can only move one disk at a time");
            q.getConstraints().add("A larger disk cannot be placed on top of a smaller disk");
            q.getHints().add("Identify the recursive base case when N = 1.");
            q.getHints().add("Recursively move N-1 disks from source to helper.");
            q.getHints().add("Move the remaining largest disk to the destination.");
            q.getHints().add("Recursively move the N-1 disks from helper to destination.");
            q.getTags().addAll(Arrays.asList("hard", "recursion", "puzzle"));
            list.add(q);
        }

        return list;
    }
}
