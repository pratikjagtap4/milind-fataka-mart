# Multi-stage Docker build for Fataka Mart Spring Boot Backend
# 1. Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace/app

# Copy pom.xml and pre-fetch dependencies for fast cached builds
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build executable jar
COPY src ./src
RUN mvn clean package -DskipTests

# 2. Runtime stage (minimal JRE 21 Alpine)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-root user with write permissions to uploads directory
RUN addgroup -S fataka && adduser -S fataka -G fataka \
    && mkdir -p /app/uploads \
    && chown -R fataka:fataka /app
USER fataka

# Copy jar from builder
COPY --from=builder /workspace/app/target/*.jar app.jar

# Expose HTTP port
EXPOSE 8080

# Environment defaults
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod

# Run application
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
