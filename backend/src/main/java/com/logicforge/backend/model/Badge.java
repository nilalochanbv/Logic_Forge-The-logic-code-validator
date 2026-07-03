package com.logicforge.backend.model;

import java.util.Date;

public class Badge {
    private String badgeId;
    private Date dateEarned;

    public Badge() {}

    public Badge(String badgeId, Date dateEarned) {
        this.badgeId = badgeId;
        this.dateEarned = dateEarned;
    }

    public String getBadgeId() {
        return badgeId;
    }

    public void setBadgeId(String badgeId) {
        this.badgeId = badgeId;
    }

    public Date getDateEarned() {
        return dateEarned;
    }

    public void setDateEarned(Date dateEarned) {
        this.dateEarned = dateEarned;
    }
}
