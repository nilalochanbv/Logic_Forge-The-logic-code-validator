package com.logicforge.backend.controller;

import com.logicforge.backend.config.JwtFilter;
import com.logicforge.backend.config.JwtUtil;
import com.logicforge.backend.model.User;
import com.logicforge.backend.service.DatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private DatabaseService databaseService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String email = body.get("email");
        String password = body.get("password");

        if (username == null || email == null || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Please provide all fields"));
        }

        try {
            if (databaseService.getUserByEmail(email).isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "User already exists with this email"));
            }

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setRole("user");

            User savedUser = databaseService.createUser(user);
            String token = jwtUtil.generateToken(savedUser);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", mapUserResponse(savedUser));
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to register user"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Please provide email and password"));
        }

        try {
            User user = databaseService.getUserByEmail(email).orElse(null);
            if (user == null || user.getPasswordHash() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
            }

            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
            }

            String token = jwtUtil.generateToken(user);
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", mapUserResponse(user));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Server error"));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleAuth(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String username = body.get("username");
        String googleId = body.get("googleId");

        if (email == null || googleId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Google authentication details incomplete"));
        }

        try {
            User user = databaseService.getUserByEmail(email).orElse(null);
            if (user == null) {
                user = new User();
                user.setUsername(username != null ? username : email.split("@")[0]);
                user.setEmail(email);
                user.setGoogleId(googleId);
                user.setRole("user");
                user = databaseService.createUser(user);
            }

            String token = jwtUtil.generateToken(user);
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", mapUserResponse(user));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Google Login failed"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof JwtFilter.UserPrincipal) {
            JwtFilter.UserPrincipal userPrincipal = (JwtFilter.UserPrincipal) principal;
            User user = databaseService.getUserById(userPrincipal.getId()).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }
            return ResponseEntity.ok(mapUserResponse(user));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
    }

    private Map<String, Object> mapUserResponse(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("email", user.getEmail());
        map.put("role", user.getRole());
        map.put("points", user.getPoints());
        map.put("currentStreak", user.getCurrentStreak());
        map.put("highestStreak", user.getHighestStreak());
        map.put("badges", user.getBadges());
        map.put("dailyStreak", user.getDailyStreak());
        map.put("lastDailySolvedDate", user.getLastDailySolvedDate());
        return map;
    }
}
