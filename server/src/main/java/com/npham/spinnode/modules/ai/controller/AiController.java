package com.npham.spinnode.modules.ai.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.npham.spinnode.modules.ai.dto.AiTextResponse;
import com.npham.spinnode.modules.ai.dto.ChatRequest;
import com.npham.spinnode.modules.ai.dto.CoverLetterRequest;
import com.npham.spinnode.modules.ai.service.AiService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/cover-letter")
    public AiTextResponse coverLetter(@Valid @RequestBody CoverLetterRequest request) {
        return aiService.generateCoverLetter(request);
    }

    @PostMapping("/chat")
    public AiTextResponse chat(@Valid @RequestBody ChatRequest request) {
        return aiService.chat(request);
    }
}
