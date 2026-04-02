package com.jira.clone.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, String> healthCheck() {
        return Map.of(
            "app", "Jira Clone API",
            "status", "RUNNING",
            "version", "1.0.0"
        );
    }
}
