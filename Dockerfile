# ==================================================
# Root-Level Multi-Stage Dockerfile for LogicForge
# ==================================================

# --- Stage 1: Build Java Project ---
FROM maven:3.8.8-openjdk-17-slim AS build
WORKDIR /app

# Copy dependency definition and source code from backend folder
COPY backend/pom.xml ./backend/
COPY backend/src ./backend/src

# Run Maven package command referencing the subfolder pom
RUN mvn clean package -DskipTests -f backend/pom.xml

# --- Stage 2: Runtime JVM Container ---
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copy compiled jar package from the build image
COPY --from=build /app/backend/target/*.jar app.jar

# Bind server port 5000
EXPOSE 5000

# Start Java microservice
ENTRYPOINT ["java", "-jar", "app.jar"]
