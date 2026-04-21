package com.npham.spinnode.modules.resume.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.npham.spinnode.modules.resume.dto.ResumeParseResponse;
import com.npham.spinnode.modules.resume.service.ResumeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping("/parse")
    public ResumeParseResponse parseResume(@RequestParam("file") MultipartFile file) {
        return resumeService.parse(file);
    }
}
