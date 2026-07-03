package com.logicforge.backend;

import com.logicforge.backend.config.EnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendJavaApplication {

    public static void main(String[] args) {
        // Load custom environmental properties from .env if present
        EnvLoader.load();
        
        SpringApplication.run(BackendJavaApplication.class, args);
    }
}
