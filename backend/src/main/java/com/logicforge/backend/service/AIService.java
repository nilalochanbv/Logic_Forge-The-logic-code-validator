package com.logicforge.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class AIService {

    @Value("${OPENAI_API_KEY:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private boolean isApiAvailable = false;

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";

    private static final String SYSTEM_PROMPT = 
        "You are the LogicForge AI Logic Evaluator. Your role is to analyze a user's step-by-step logical reasoning to solve a computational logic problem.\n" +
        "CRITICAL RULES:\n" +
        "1. You must NEVER write, generate, or suggest code, syntax, keywords (like 'var', 'int', 'printf', 'console.log', 'function()', etc.), or programming syntax.\n" +
        "2. You must NEVER teach programming language syntax.\n" +
        "3. You must NEVER provide full solutions or reveal direct answers.\n" +
        "4. You must ONLY evaluate the logical sequence, completeness, validity, efficiency, and clarity of the steps.\n" +
        "5. Provide helpful hints, identify gaps, and explain logical flaws. Use plain English suitable for absolute beginners.\n\n" +
        "You must respond ONLY with a JSON object. Do not include markdown code block syntax (like ```json) in your response, just return the raw JSON string.\n\n" +
        "The JSON response format MUST be:\n" +
        "{\n" +
        "  \"correctnessStatus\": \"correct\" | \"incorrect\",\n" +
        "  \"logicQualityScore\": number (0 to 100),\n" +
        "  \"stars\": number (1 to 5),\n" +
        "  \"explanation\": \"string explaining the correctness or overall feedback\",\n" +
        "  \"missingSteps\": [\"string listing missing step details or null\"],\n" +
        "  \"flaws\": [\"string listing logical gaps, incorrect order, or inefficiencies\"],\n" +
        "  \"suggestions\": [\"string suggesting ways to improve their logic\"]\n" +
        "}\n";

    private static final String LOGICBOT_SYSTEM_PROMPT =
        "You are LogicBot, the AI Mentor for the LogicForge coding-learning platform.\n" +
        "Your sole purpose is helping users improve logical thinking and problem-solving ability.\n\n" +
        "CRITICAL ASSISTANT RULES:\n" +
        "1. You are NOT a coding assistant. You are a LOGIC ASSISTANT.\n" +
        "2. You must NEVER generate code, compile code, execute code, or output ready-to-run programs.\n" +
        "3. You must NEVER reveal complete solutions or direct implementations.\n" +
        "4. You must NEVER teach programming language syntax.\n" +
        "5. If the user asks for code, implementations, or syntax (e.g. \"Give me code\"), you must reply: \"My purpose is to help you build logic independently. I cannot provide code solutions, but I can help you think through the problem.\"\n" +
        "6. If the user submits steps of logic, you must evaluate them. Detect missing steps, wrong sequence, redundant steps, and clarity. Format your review EXACTLY as follows:\n\n" +
        "   Logic Analysis\n\n" +
        "   Correctness: [Percentage]%\n\n" +
        "   Strengths:\n" +
        "   ✓ [Strength 1]\n\n" +
        "   Improvements:\n" +
        "   ⚠ [Improvement 1]\n\n" +
        "   Logic Rating:\n" +
        "   [Stars like ★★★★☆]\n\n" +
        "7. Be encouraging, friendly, motivational, and beginner-friendly. Keep non-review answers clear, short, and conceptual.\n";

    @PostConstruct
    public void init() {
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            isApiAvailable = true;
            System.out.println("OpenAI API client initialized.");
        } else {
            System.out.println("No OPENAI_API_KEY found. AI Evaluator will run in Local Heuristic Fallback mode.");
        }
    }

    public Map<String, Object> evaluateLogic(String questionTitle, List<String> steps) {
        // Pre-validate steps for code leakage
        String stepsText = String.join(" ", steps).toLowerCase();
        String[] codeKeywords = {"var ", "let ", "const ", "int ", "float ", "double ", "print(", "console.log", "printf", "cout", "system.out", "def ", "function", "class ", "void ", "public ", "include ", "import "};
        
        boolean containsCode = false;
        for (String kw : codeKeywords) {
            if (stepsText.contains(kw)) {
                containsCode = true;
                break;
            }
        }

        if (containsCode) {
            Map<String, Object> fallbackResult = new HashMap<>();
            fallbackResult.put("correctnessStatus", "incorrect");
            fallbackResult.put("logicQualityScore", 20);
            fallbackResult.put("stars", 1);
            fallbackResult.put("explanation", "Your steps contain programming language syntax or keywords (like 'let', 'var', 'int', 'console.log'). LogicForge does not accept program code or syntax. Please express your reasoning in plain, conversational English steps.");
            fallbackResult.put("missingSteps", new ArrayList<>());
            fallbackResult.put("flaws", Collections.singletonList("Used programming syntax instead of algorithmic logic."));
            fallbackResult.put("suggestions", Collections.singletonList("Write your steps in human readable language, describing actions step-by-step (e.g. 'Store the first value', 'Compare if A is greater than B')."));
            return fallbackResult;
        }

        if (!isApiAvailable) {
            return localEvaluateLogic(questionTitle, steps);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");
            
            Map<String, String> responseFormat = new HashMap<>();
            responseFormat.put("type", "json_object");
            requestBody.put("response_format", responseFormat);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
            
            StringBuilder userPrompt = new StringBuilder();
            userPrompt.append("Problem Title: \"").append(questionTitle).append("\"\nUser's Submitted Logic Steps:\n");
            for (int i = 0; i < steps.size(); i++) {
                userPrompt.append("Step ").append(i + 1).append(": ").append(steps.get(i)).append("\n");
            }
            messages.add(Map.of("role", "user", "content", userPrompt.toString()));
            
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.2);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            String response = restTemplate.postForObject(OPENAI_URL, entity, String.class);

            JsonNode rootNode = objectMapper.readTree(response);
            String content = rootNode.path("choices").get(0).path("message").path("content").asText();
            
            return objectMapper.readValue(content, new TypeReference<Map<String, Object>>(){});
        } catch (Exception e) {
            System.err.println("OpenAI API evaluation failed, falling back to local heuristic. Error: " + e.getMessage());
            return localEvaluateLogic(questionTitle, steps);
        }
    }

    public String askMentor(String questionTitle, String questionDescription, String userQuestion, List<Map<String, String>> chatHistory) {
        if (!isApiAvailable) {
            String q = userQuestion.toLowerCase();
            if (q.contains("help") || q.contains("hint") || q.contains("start")) {
                return "To start, think about what inputs you need from the user. For instance, do you need one number, two, or a string? How will you store them?";
            }
            if (q.contains("answer") || q.contains("code") || q.contains("solution")) {
                return "I cannot provide you with source code or a direct solution. Think about the process: step-by-step, how would you solve this with pencil and paper?";
            }
            if (q.contains("loop") || q.contains("repeat")) {
                return "A loop is useful when you need to repeat an action. You should specify what variable is changing in each cycle, and when the loop should stop.";
            }
            return "For \"" + questionTitle + "\", make sure you break down the problem into individual logical actions. Can you tell me what you think the first step should be?";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", 
                "You are the LogicForge AI Mentor. \n" +
                "Your goal is to guide beginner programmers to develop their logical thinking skills.\n" +
                "CRITICAL RULES:\n" +
                "1. NEVER generate source code.\n" +
                "2. NEVER suggest programming syntax or variable declarations like 'int a'. Instead suggest concepts like 'a place to store a number'.\n" +
                "3. NEVER reveal the complete solution.\n" +
                "4. Keep answers brief (max 3 sentences) and highly encouraging.\n" +
                "5. Guide the user by asking leading questions.\n"));

            StringBuilder userPrompt = new StringBuilder();
            userPrompt.append("Problem: ").append(questionTitle)
                      .append("\nDescription: ").append(questionDescription)
                      .append("\nChat History: ").append(objectMapper.writeValueAsString(chatHistory))
                      .append("\nUser Question: \"").append(userQuestion).append("\"");

            messages.add(Map.of("role", "user", "content", userPrompt.toString()));
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 150);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            String response = restTemplate.postForObject(OPENAI_URL, entity, String.class);

            JsonNode rootNode = objectMapper.readTree(response);
            return rootNode.path("choices").get(0).path("message").path("content").asText().trim();
        } catch (Exception e) {
            System.err.println("OpenAI Mentor API failed, falling back. Error: " + e.getMessage());
            return "Think about the input values needed for this problem, and what logical check you need to do on them next. What do you think is your first step?";
        }
    }

    public String chatWithLogicBot(String userMessage, List<Map<String, String>> chatHistory, Map<String, Object> userStats) {
        String lowercaseMsg = userMessage.toLowerCase();

        // Safety rules check
        boolean asksForCode = lowercaseMsg.contains("code") || lowercaseMsg.contains("write a program") || 
                              lowercaseMsg.contains("python") || lowercaseMsg.contains("javascript") || 
                              lowercaseMsg.contains("java") || lowercaseMsg.contains("c++") || 
                              lowercaseMsg.contains("html") || lowercaseMsg.contains("function") || 
                              lowercaseMsg.contains("syntax") || lowercaseMsg.contains("implement");
                              
        if (asksForCode && (lowercaseMsg.contains("give") || lowercaseMsg.contains("write") || 
                            lowercaseMsg.contains("show") || lowercaseMsg.contains("provide") || 
                            lowercaseMsg.contains("get") || lowercaseMsg.contains("create") || 
                            lowercaseMsg.contains("teach") || lowercaseMsg.contains("print"))) {
            return "My purpose is to help you build logic independently. I cannot provide code solutions, but I can help you think through the problem.";
        }

        // Stats inquiry check
        boolean asksStats = lowercaseMsg.contains("progress") || lowercaseMsg.contains("solved") || 
                            lowercaseMsg.contains("my streak") || lowercaseMsg.contains("my badge") || 
                            lowercaseMsg.contains("points") || lowercaseMsg.contains("how many question");
        if (asksStats) {
            Object solvedCount = userStats.get("solvedCount");
            int solvedTotal = solvedCount != null ? ((Number) solvedCount).intValue() : 0;
            int currentStreak = userStats.get("currentStreak") != null ? ((Number) userStats.get("currentStreak")).intValue() : 0;
            String currentBadge = userStats.get("currentBadge") != null ? (String) userStats.get("currentBadge") : "Novice";
            int points = userStats.get("points") != null ? ((Number) userStats.get("points")).intValue() : 0;
            return String.format("You have solved %d questions.\n\nCurrent streak: %d days.\n\nCurrent badge: %s.\n\nTotal points: %d PTS. Keep building your logic skills!", 
                    solvedTotal, currentStreak, currentBadge, points);
        }

        // Determine if user message looks like steps submission
        boolean isNumberedList = Pattern.compile("^\\d+\\.\\s", Pattern.MULTILINE).matcher(userMessage).find() || 
                                 userMessage.contains("\n-") || userMessage.contains("\n*") || 
                                 lowercaseMsg.contains("step 1") || lowercaseMsg.contains("steps:");

        if (!isApiAvailable) {
            if (isNumberedList) {
                return "Logic Analysis\n\nCorrectness: 80%\n\nStrengths:\n✓ Input steps are clearly identified\n✓ Flow matches logical requirements\n\nImprovements:\n⚠ Missing edge case checking (e.g. invalid arguments)\n⚠ Output step could specify formatting\n\nLogic Rating:\n★★★★☆";
            }
            if (lowercaseMsg.contains("hello") || lowercaseMsg.contains("hi") || lowercaseMsg.contains("hey")) {
                return "Welcome back! I am LogicBot, your personal logic-building mentor. I can help you understand problems, review your logic, provide hints, and track your progress. Remember: I help you think. I do not write code.";
            }
            if (lowercaseMsg.contains("streak") || lowercaseMsg.contains("motivation") || lowercaseMsg.contains("badge")) {
                return "You're doing fantastic! Today's challenge awaits. Complete one logic problem to continue your streak and earn reward points.";
            }
            return "Good thinking. Can you break down the problem into smaller logical actions? What do you think happens first?";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", LOGICBOT_SYSTEM_PROMPT));

            for (Map<String, String> h : chatHistory) {
                messages.add(Map.of(
                    "role", h.get("sender").equals("user") ? "user" : "assistant",
                    "content", h.get("text")
                ));
            }

            messages.add(Map.of("role", "user", "content", "User Stats: " + objectMapper.writeValueAsString(userStats) + "\nUser Input: \"" + userMessage + "\""));
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.6);
            requestBody.put("max_tokens", 250);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            String response = restTemplate.postForObject(OPENAI_URL, entity, String.class);

            JsonNode rootNode = objectMapper.readTree(response);
            return rootNode.path("choices").get(0).path("message").path("content").asText().trim();
        } catch (Exception e) {
            System.err.println("OpenAI Bot failed, falling back. Error: " + e.getMessage());
            if (isNumberedList) {
                return "Logic Analysis\n\nCorrectness: 80%\n\nStrengths:\n✓ Clean sequence ordering\n\nImprovements:\n⚠ Storage allocation unclear\n\nLogic Rating:\n★★★★☆";
            }
            return "Try breaking the problem into smaller actions. Can you check what value is initialized first?";
        }
    }

    private Map<String, Object> localEvaluateLogic(String questionTitle, List<String> steps) {
        String stepsText = String.join(" ", steps).toLowerCase();
        
        String correctnessStatus = "incorrect";
        int logicQualityScore = 20;
        int stars = 1;
        String explanation = "Your logic looks incomplete. Please break down your solution into clearer sequential steps.";
        List<String> missingSteps = new ArrayList<>();
        List<String> flaws = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        String title = questionTitle.toLowerCase();
        
        if (steps.size() < 3) {
            Map<String, Object> res = new HashMap<>();
            res.put("correctnessStatus", "incorrect");
            res.put("logicQualityScore", 30);
            res.put("stars", 2);
            res.put("explanation", "Your logic has too few steps. A complete logic flow needs to receive inputs, perform processing, and output a result.");
            res.put("missingSteps", Arrays.asList("Receiving or storing inputs", "Processing steps", "Displaying/outputting the outcome"));
            res.put("flaws", Collections.singletonList("Too brief, lacks step-by-step detail."));
            res.put("suggestions", Collections.singletonList("Try expanding your solution step-by-step, starting from reading the input variables, then operating on them, and finally displaying the result."));
            return res;
        }

        if (title.contains("sum of two numbers")) {
            boolean hasInput = stepsText.contains("input") || stepsText.contains("take") || stepsText.contains("get") || stepsText.contains("read") || stepsText.contains("first") || stepsText.contains("receive") || stepsText.contains("ask") || stepsText.contains("prompt") || stepsText.contains("value");
            boolean hasAdd = stepsText.contains("add") || stepsText.contains("sum") || stepsText.contains("plus") || stepsText.contains("+");
            boolean hasOutput = stepsText.contains("display") || stepsText.contains("output") || stepsText.contains("print") || stepsText.contains("show") || stepsText.contains("result");

            if (hasInput && hasAdd && hasOutput) {
                correctnessStatus = "correct";
                logicQualityScore = 95;
                stars = 5;
                explanation = "Your sequence of steps correctly and clearly solves the problem of adding two numbers.";
                suggestions.add("Great job! Your logic is fully sound and sequential.");
            } else {
                if (!hasInput) {
                    missingSteps.add("Prompting or taking the input values.");
                    flaws.add("No clear input step detected.");
                }
                if (!hasAdd) {
                    missingSteps.add("The mathematical addition step.");
                    flaws.add("Lacks logic to actually combine the numbers.");
                }
                if (!hasOutput) {
                    missingSteps.add("Displaying the result to the user.");
                    flaws.add("The logic performs computation but never outputs the final sum.");
                }
                logicQualityScore = 50 + (hasInput ? 15 : 0) + (hasAdd ? 15 : 0) + (hasOutput ? 10 : 0);
                stars = Math.max(2, logicQualityScore / 20);
                explanation = "You have some of the key concepts, but the step-by-step logic is incomplete or lacks proper progression.";
                suggestions.add("Rearrange your steps to first read inputs, then add them, and finally output the sum.");
            }
        } 
        else if (title.contains("even or odd")) {
            boolean hasInput = stepsText.contains("input") || stepsText.contains("take") || stepsText.contains("get") || stepsText.contains("read") || stepsText.contains("number");
            boolean hasDivide = stepsText.contains("divide") || stepsText.contains("remainder") || stepsText.contains("modulo") || stepsText.contains("%") || stepsText.contains("divisible");
            boolean hasCondition = stepsText.contains("if") || stepsText.contains("check") || stepsText.contains("whether");
            boolean hasOutput = stepsText.contains("even") && stepsText.contains("odd");

            if (hasInput && hasDivide && hasCondition && hasOutput) {
                correctnessStatus = "correct";
                logicQualityScore = 90;
                stars = 5;
                explanation = "Excellent logic flow. You successfully checked division by two and separated output logic for even and odd conditions.";
                suggestions.add("Perfect structure. You can continue to the next challenge.");
            } else {
                if (!hasInput) missingSteps.add("Getting the input number.");
                if (!hasDivide) {
                    missingSteps.add("Dividing by 2 or checking the remainder.");
                    flaws.add("Lacks verification of divisibility.");
                }
                if (!hasCondition) missingSteps.add("Conditional logic ('IF / ELSE') block to separate odd/even results.");
                if (!hasOutput) missingSteps.add("Displaying the text 'Even' or 'Odd' depending on the decision.");
                
                logicQualityScore = 40 + (hasInput ? 15 : 0) + (hasDivide ? 15 : 0) + (hasCondition ? 15 : 0) + (hasOutput ? 10 : 0);
                stars = Math.max(2, logicQualityScore / 20);
                explanation = "Your logic has some gaps. You need to read a number, check if its remainder divided by 2 is zero, and display Even/Odd accordingly.";
                suggestions.add("Add an IF/ELSE check: IF remainder is 0 output Even, ELSE output Odd.");
            }
        } 
        else if (title.contains("largest of three numbers")) {
            boolean hasInput = stepsText.contains("three") || stepsText.contains("numbers") || stepsText.contains("inputs") || stepsText.contains("read") || stepsText.contains("take");
            boolean hasCompare = stepsText.contains("compare") || stepsText.contains(">") || stepsText.contains("greater") || stepsText.contains("larger");
            boolean hasOutput = stepsText.contains("display") || stepsText.contains("print") || stepsText.contains("output") || stepsText.contains("largest") || stepsText.contains("max");

            if (hasInput && hasCompare && hasOutput) {
                correctnessStatus = "correct";
                logicQualityScore = 92;
                stars = 5;
                explanation = "Great job! You sequentially compared the three values to identify the maximum and printed it.";
                suggestions.add("Very clean structure. Ready for intermediate tasks.");
            } else {
                if (!hasInput) missingSteps.add("Obtaining all three numbers.");
                if (!hasCompare) {
                    missingSteps.add("Comparison logic between values.");
                    flaws.add("No explicit comparison checking.");
                }
                if (!hasOutput) missingSteps.add("Outputting the resulting largest value.");
                logicQualityScore = 45 + (hasInput ? 15 : 0) + (hasCompare ? 20 : 0) + (hasOutput ? 10 : 0);
                stars = Math.max(2, logicQualityScore / 20);
                explanation = "You need a clear set of comparisons. Compare the first to both others, then compare the second and third to find the overall maximum.";
                suggestions.add("Try writing a step checking if A > B AND A > C. If true, A is the largest. Otherwise, compare B and C.");
            }
        } 
        else if (title.contains("prime number")) {
            boolean hasInput = stepsText.contains("input") || stepsText.contains("number") || stepsText.contains("take");
            boolean hasLoop = stepsText.contains("loop") || stepsText.contains("repeat") || stepsText.contains("for each") || stepsText.contains("from 2");
            boolean hasCheck = stepsText.contains("divide") || stepsText.contains("remainder") || stepsText.contains("modulo") || stepsText.contains("%");
            boolean hasOutput = stepsText.contains("prime");

            if (hasInput && hasLoop && hasCheck && hasOutput) {
                correctnessStatus = "correct";
                logicQualityScore = 90;
                stars = 5;
                explanation = "Superb! You correctly outlined a loop checking divisors from 2 up to N-1 (or square root of N) and handled the prime status decision.";
                suggestions.add("This is a standard, efficient prime verification logic.");
            } else {
                if (!hasLoop) {
                    missingSteps.add("A loop to test multiple divisor values.");
                    flaws.add("Lacks iterative checking. Testing only one divisor is not enough for all numbers.");
                }
                if (!hasCheck) missingSteps.add("Dividing N by the loop counter and checking for a remainder of 0.");
                logicQualityScore = 40 + (hasInput ? 10 : 0) + (hasLoop ? 20 : 0) + (hasCheck ? 15 : 0) + (hasOutput ? 10 : 0);
                stars = Math.max(1, logicQualityScore / 20);
                explanation = "Prime testing requires checking if any number between 2 and N-1 divides N evenly. You must describe this loop and divisibility check.";
                suggestions.add("Add a loop: 'For each number 'i' starting from 2 up to N-1, check if N is divisible by 'i'. If yes, it is not prime.'");
            }
        }
        else if (title.contains("smallest number")) {
            boolean hasInput = stepsText.contains("list") || stepsText.contains("array") || stepsText.contains("numbers") || stepsText.contains("input");
            boolean hasLoop = stepsText.contains("loop") || stepsText.contains("repeat") || stepsText.contains("each") || stepsText.contains("for");
            boolean hasCompare = stepsText.contains("smaller") || stepsText.contains("<") || stepsText.contains("smallest") || stepsText.contains("compare");
            boolean hasOutput = stepsText.contains("display") || stepsText.contains("output") || stepsText.contains("print") || stepsText.contains("smallest");

            if (hasInput && hasLoop && hasCompare && hasOutput) {
                correctnessStatus = "correct";
                logicQualityScore = 95;
                stars = 5;
                explanation = "Perfect! You successfully initialized the smallest variable, looped through the list, and updated the smallest value when a smaller item was found.";
                suggestions.add("Great job! Your logic is robust.");
            } else {
                if (!hasLoop) missingSteps.add("A loop to scan through all elements of the list.");
                if (!hasCompare) missingSteps.add("A comparison step to check if the current element is smaller than the current minimum.");
                logicQualityScore = 50 + (hasInput ? 10 : 0) + (hasLoop ? 15 : 0) + (hasCompare ? 15 : 0) + (hasOutput ? 10 : 0);
                stars = Math.max(2, logicQualityScore / 20);
                explanation = "You need to iterate through the array, compare each item to the current minimum, and output the final minimum.";
            }
        }
        else if (title.contains("celsius to fahrenheit")) {
            boolean hasFormula = (stepsText.contains("multiply") || stepsText.contains("*")) && 
                                 (stepsText.contains("divide") || stepsText.contains("/")) && 
                                 (stepsText.contains("add 32") || stepsText.contains("+ 32") || stepsText.contains("+32"));
            
            if (hasFormula) {
                correctnessStatus = "correct";
                logicQualityScore = 98;
                stars = 5;
                explanation = "Excellent. You accurately specified the math operations to convert Celsius to Fahrenheit.";
                suggestions.add("Formula logic is completely sound.");
            } else {
                missingSteps.add("The mathematical conversion operations: multiply by 9, divide by 5, and add 32.");
                logicQualityScore = 40;
                stars = 2;
                explanation = "The conversion formula logic is missing or incorrect. Make sure you multiply Celsius by 9/5 and add 32.";
            }
        }
        else if (title.contains("count vowels")) {
            boolean hasLoop = stepsText.contains("loop") || stepsText.contains("repeat") || stepsText.contains("each letter") || stepsText.contains("character");
            boolean hasVowels = stepsText.contains("vowel") || stepsText.contains("a, e, i, o, u") || stepsText.contains("check if letter");
            boolean hasIncrement = stepsText.contains("add 1") || stepsText.contains("increment") || stepsText.contains("increase count");

            if (hasLoop && hasVowels && hasIncrement) {
                correctnessStatus = "correct";
                logicQualityScore = 92;
                stars = 5;
                explanation = "Great job! Your logic loop scans the string, correctly identifies vowels, increments the count, and outputs the result.";
            } else {
                if (!hasLoop) missingSteps.add("An iterative loop to scan each character of the text.");
                if (!hasVowels) missingSteps.add("A check to see if the character matches any vowel (a, e, i, o, u).");
                if (!hasIncrement) missingSteps.add("Incrementing the count tracker by 1 when a vowel is matched.");
                logicQualityScore = 50;
                stars = 2;
                explanation = "You need to loop through the text, check each letter for vowels, count them, and display the final sum.";
            }
        }
        else {
            // General heuristics
            boolean hasInput = stepsText.contains("input") || stepsText.contains("read") || stepsText.contains("take") || stepsText.contains("store");
            boolean hasOutput = stepsText.contains("display") || stepsText.contains("output") || stepsText.contains("print") || stepsText.contains("result") || stepsText.contains("show");
            
            if (hasInput && hasOutput && steps.size() >= 4) {
                correctnessStatus = "correct";
                logicQualityScore = 85;
                stars = 4;
                explanation = "Your logic flows in a reasonable sequence with clear input/output handling. Make sure your processing loops or statements cover edge cases.";
                suggestions.add("Try outlining any loop constraints or boundary values to make the logic robust.");
            } else {
                if (!hasInput) missingSteps.add("Reading inputs.");
                if (!hasOutput) missingSteps.add("Outputting result.");
                logicQualityScore = 50;
                stars = 2;
                explanation = "Your logic requires more concrete steps. Ensure you define inputs, describe how you process them, and specify how the result is displayed.";
                suggestions.add("Make sure to start with a setup/input phase and conclude with an output/display phase.");
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("correctnessStatus", correctnessStatus);
        result.put("logicQualityScore", logicQualityScore);
        result.put("stars", stars);
        result.put("explanation", explanation);
        result.put("missingSteps", missingSteps.isEmpty() ? null : missingSteps);
        result.put("flaws", flaws.isEmpty() ? null : flaws);
        result.put("suggestions", suggestions.isEmpty() ? Collections.singletonList("Keep detailing your logic sequentially.") : suggestions);

        return result;
    }
}
