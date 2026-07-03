package com.logicforge.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Document(collection = "submissions")
public class Submission {
    @Id
    @JsonProperty("_id")
    private String id;
    
    private String userId;
    private String questionId;
    private Date date = new Date();
    private List<String> logicSubmitted = new ArrayList<>();
    private String aiFeedback;
    private int stars = 0;
    private String correctnessStatus;
    private int pointsAwarded = 0;

    public Submission() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getQuestionId() {
        return questionId;
    }

    public void setQuestionId(String questionId) {
        this.questionId = questionId;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public List<String> getLogicSubmitted() {
        return logicSubmitted;
    }

    public void setLogicSubmitted(List<String> logicSubmitted) {
        this.logicSubmitted = logicSubmitted;
    }

    public String getAiFeedback() {
        return aiFeedback;
    }

    public void setAiFeedback(String aiFeedback) {
        this.aiFeedback = aiFeedback;
    }

    public int getStars() {
        return stars;
    }

    public void setStars(int stars) {
        this.stars = stars;
    }

    public String getCorrectnessStatus() {
        return correctnessStatus;
    }

    public void setCorrectnessStatus(String correctnessStatus) {
        this.correctnessStatus = correctnessStatus;
    }

    public int getPointsAwarded() {
        return pointsAwarded;
    }

    public void setPointsAwarded(int pointsAwarded) {
        this.pointsAwarded = pointsAwarded;
    }
}
