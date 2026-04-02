package com.jira.clone.security.annotations;

import com.jira.clone.models.enums.Action;
import com.jira.clone.models.enums.Resource;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface CheckProjectPermission {
    Resource resource();
    Action action();
    
    /**
     * Tên tham số chứa projectId (nếu nằm trong PathVariable)
     */
    String projectIdParam() default "projectId";

    /**
     * Tên tham số chứa issueId (nếu cần truy xuất projectId từ issue)
     */
    String issueIdParam() default "";

    String sprintIdParam() default "";

    String commentIdParam() default "";

    String statusIdParam() default "";

    String memberIdParam() default "";

    String linkIdParam() default "";
}
