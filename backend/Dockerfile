# ==========================================
# Maven / Spring Boot Docker Builder Profile
# ==========================================

# --- Stage 1: Build the Application JAR ---
FROM maven:3.8.8-openjdk-17-slim AS build
WORKDIR /app

# Copy POM and dependencies mappings
COPY pom.xml .
COPY src ./src

# Build production JAR without running test suites
RUN mvn clean package -DskipTests

# --- Stage 2: Runtime Environment ---
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copy the generated JAR from the build container
COPY --from=build /app/target/*.jar app.jar

# Expose server port 5000
EXPOSE 5000

# Execute the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
