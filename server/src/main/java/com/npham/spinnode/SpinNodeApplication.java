package com.npham.spinnode;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SpinNodeApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpinNodeApplication.class, args);
	}

}
