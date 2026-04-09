package com.jira.clone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@org.springframework.context.annotation.EnableAspectJAutoProxy
public class JiraCloneApplication {

	public static void main(String[] args) {
		SpringApplication.run(JiraCloneApplication.class, args);
	}

}
