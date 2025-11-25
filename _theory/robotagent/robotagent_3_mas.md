---
title: "RobotAgent：协作（Part 3/5）"
excerpt: '多机器人智能体系统'

collection: theory
category: robotagent
permalink: /theory/robotagent/mas
tags: 
  - robotagent

layout: single
read_time: true
author_profile: false
comments: true
share: true
related: true
---

![](../../images/theory/robotagent/mas/a2a.png)

## MAS协作

多agent系统（MAS）[^1]适用于RobotAgent的多机智能体协作，利用群体智慧，采用结构化的`工作流`、定义统一的`交互规范`来同步他们的行动以实现协作目标。

### 一、工作流

在单个Agent系统中，工作流将任务拆解到决策层面，而MAS中的工作流协调多个智能体，完成一个共同的任务。

### 二、交互规范

Agent-Agent交互规范：
- 面向共识的交互，包括各种共识方案：讨论, 辩论, 谈判, 反射和投票。
- 协作学习交互，常用方法：经验分享，同伴讨论，观察学习。
- 教学/指导交互，常用方法：批评和反馈，评估，命令和教学。
- 迭代式教学与强化，教学通常是渐进式的，每个阶段都为学习者提供完成任务和获得反馈的机会。
- 面向任务的交互，agent通过有效的协调和任务分解策略，以及高度的合作和协调，共同工作以实现共同目标，agent主要通过处理上游输出并根据既定的任务依赖关系为下游智能体生成结果
来进行交互，而不是进行复杂的讨论或辩论。

## A2A协议

### 一、应用场景

容易混淆的是MCP协议，A2A是agent-agent通信协议，MCP是agent-环境通信协议。
- A2A：主要关注智能体之间的协作，特别是解决应用层协议
- MCP：主要关注标准化AI模型与外部数据源（如数据库、API、文件系统）的连接。

### 二、

消息类型：
- 结构化，常见的有JSON、XML和代码形式。
- 非结构化，自然文本，视觉数据（例如图像、视频）和音频信号（例如语音、环境声音）。

[^1]: MAS https://google.github.io/adk-docs/agents/multi-agents/
