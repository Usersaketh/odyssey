# Multi-stage Dockerfile for Odyssey backend (Spring Boot)
# Build stage
FROM maven:3.9.4-eclipse-temurin-17 as builder
WORKDIR /workspace

# Copy pom and download dependencies (cache)
COPY pom.xml ./
COPY mvnw* ./
# copy .mvn folder only if it exists
RUN mkdir -p .mvn

RUN mvn -B -f pom.xml -q dependency:go-offline

# Copy source and build
COPY src ./src
RUN mvn -B -f pom.xml -DskipTests package

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
ARG JAR_FILE=target/odyssey-backend-0.0.1-SNAPSHOT.jar
COPY --from=builder /workspace/${JAR_FILE} ./app.jar

EXPOSE 9090
ENV JAVA_OPTS="-Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
