package com.civicrules;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CivicPulseApplication {

    public static void main(String[] args) {
        SpringApplication.run(CivicPulseApplication.class, args);
        System.out.println("CivicPulse Application Started Successfully!");
        System.out.println("Server running on: http://localhost:8080");
    }
}