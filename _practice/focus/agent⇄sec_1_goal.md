---
title: "Agent⇄Sec：目标（Part 1/）"
excerpt: ''

collection: practice
category: 
permalink: /practice/focus/a⇄s-goal
tags: 
  - agent
  - vuln
  - fuzz
  - sast
  - patch

layout: single
read_time: true
author_profile: false
comments: true
share: true
related: true
---

a⇄s即a4s为s4a赋能，达到a4a的效果。因此，首先要梳理a中的s问题：
- a的底层代码问题，如python，java。
- a伴生问题，机器人a的干扰，注入。

1.  **架构与代码层面**
    *   **依赖链漏洞**：Agent所依赖的框架（如LangChain）、模型（如GPT API）、第三方工具库中的安全漏洞。
    *   **不安全的工具调用**：Agent被赋予调用外部工具/API的能力，但缺乏对调用参数、次数的有效校验和沙箱隔离，导致命令注入、资源滥用等风险。
    *   **不安全的提示处理**：Prompt模板注入，用户输入被直接拼接成系统提示，破坏了原有指令结构。
    *   **敏感信息泄露**：在日志、错误信息或与用户的交互中，无意泄露了系统提示、API密钥、内部架构等敏感信息。
    *   **配置错误**：不安全的默认配置，如过高的权限、过长的上下文窗口导致提示泄露风险。

2.  **数据与模型层面**
    *   **训练数据投毒**：影响基于微调模型的Agent。
    *   **对抗性攻击**：精心构造的输入，旨在让Agent产生错误决策或绕过安全限制。
    *   **模型固有偏见**：导致Agent在安全决策（如内容审核、权限分配）上出现不公平或错误。

3.  **交互与行为层面**
    *   **提示注入**：直接攻击Agent的“大脑”，使其违背设计者的初衷。这是目前对LLM Agent最核心的威胁。
    *   **越狱**：一种特殊的提示注入，旨在让Agent突破其设定的道德或安全准则。
    *   **资源耗尽攻击**：通过构造特定对话，诱导Agent进入无限循环或执行高资源消耗任务，导致服务拒绝。
    *   **多智能体协同攻击**：在多Agent系统中，攻击一个Agent作为跳板，进而影响整个系统。

两种方式
1. 完全agent
2. 工具辅助agent，

直接rl + fuzzing，效果低下。rl负责变异，fuzzing负责执行和反馈奖励。

知识蒸馏，实现一个完善的slm

掩码是漏洞补丁，预测该补丁
生成时，输入正常代码，输出补丁。

从落地的项目Cursor吸取经验