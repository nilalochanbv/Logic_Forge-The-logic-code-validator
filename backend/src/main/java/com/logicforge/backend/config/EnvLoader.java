package com.logicforge.backend.config;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

public class EnvLoader {
    public static void load() {
        File[] envFiles = {
            new File(".env"),
            new File("backend_java/.env"),
            new File("../backend/.env"),
            new File("backend/.env")
        };
        
        for (File file : envFiles) {
            if (file.exists() && file.isFile()) {
                System.out.println("Loading environment variables from: " + file.getAbsolutePath());
                try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) {
                            continue;
                        }
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String value = line.substring(eqIdx + 1).trim();
                            
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                } catch (IOException e) {
                    System.err.println("Failed to read environment file " + file.getName() + ": " + e.getMessage());
                }
                break;
            }
        }
    }
}
