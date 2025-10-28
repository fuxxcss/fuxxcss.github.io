---
title: "RobotAgent：八股文（Part 5/5）"
excerpt: '大模型，开发框架'

collection: theory
category: robotagent
permalink: /theory/robotagent/8gu
tags: 
  - robotagent
  - 8gu

layout: single
read_time: true
author_profile: false
comments: true
share: true
related: true
---

![](../../images/theory/8gu.png)

**1.机器人agent**

https://ubtrobot.zhiye.com/campus/jobs
https://www.iguopin.com/job/detail?id=162661896695057286
https://careers.tencent.com/jobdesc.html?postId=1968241074312990720
https://app.mokahr.com/campus-recruitment/chaitin/92701#/job/41c646e6-ad12-4e70-b827-fb1820749424
https://www.inhand.com.cn/job/2026%e5%b1%8a%e6%a0%a1%e6%8b%9b-%e6%9c%ba%e5%99%a8%e4%ba%ba%e6%93%8d%e4%bd%9c%e6%8e%a7%e5%88%b6%e7%ae%97%e6%b3%95%e5%b7%a5%e7%a8%8b%e5%b8%88/

**2.agent开发、算法**

https://baicgroup.zhiye.com/campus/detail?jobAdId=a5d4473f-f2e9-41c1-8b7e-b4a3a0f2c90a
https://zhaopin.meituan.com/web/position/detail?jobUnionId=3587000738&highlightType=campus
https://xyzp.51job.com/ZYJTGS/jobs.html
https://careers.tencent.com/jobdesc.html?postId=1927266914715959296
https://careers.tencent.com/jobdesc.html?postId=1934984934909386752

**3.agent产品**

https://360campus.zhiye.com/campus/detail?jobAdId=51f509b6-c260-45cb-aef0-ac14decaee5c

**4.ai + 代码**

https://careers.tencent.com/jobdesc.html?postId=1912720859416608768，https://careers.tencent.com/jobdesc.html?postId=1670301957484453888
https://zhaopin.meituan.com/web/position/detail?jobUnionId=3716319423&highlightType=campus

**5.机器人**

## 任职要求

### 一、机器人

仿真环境：熟悉主流机器人仿真环境，包括但不限于 Isaac Sim、MuJoCo 等，能进行环境构建、资产导入和大规模并行训练。
有仿真到现实迁移项目经验者优先。
了解机器人运动学、动力学基础，熟悉抓取、放置、装配等常见机器人操作任务及路径规划、力控等相关算法者优先。
有机器人操作相关项目经历（如基于视频生成模型的机器人控制、跨机器人平台适配、长周期任务规划），或在 ICRA、IROS、NeurIPS、CVPR 等领域顶会发表论文者优先。
熟悉主流机器人仿真软件，如NVIDIA Isaac Sim, mujoco, raisim, gazebo, pybullet, vrep等；

### 二、智能体

熟悉 VLA 多模态模型的训练与推理。
深入理解强化学习基础理论 (PPO, GRPO 等) 及实践经验。
熟练掌握 PyTorch/TensorFlow 等深度学习框架。
探索端到端操作框架，结合大语言模型（LLM）与视觉-动作映射，实现“感知→决策→执行”的高效闭环； 
了解常用的深度强化学习算法（PPO、SAC、DQN、DDPG、A3C等）；

## 机器人


## 智能体

### 一、大模型

1.Transformer 模型的基本结构包括哪些部分？各个部分的作用？

 Transformer 模型的基本结构主要包括输入嵌入层、位置编码、编码器（Encoder）、解码器（Decoder）以及最终的线性层和softmax层。

2.Transformer 中如何实现序列到序列的映射？

通过编码器-解码器架构实现，编码器处理输入序列并生成一个上下文表示，解码器则根据该表示和前面生成的序列生成下一个输出。

3.Transformer 模型如何处理不同长度的输入序列？

通过使用注意力遮蔽和位置编码，Transformer能够有效处理不同长度的输入序列，遮蔽确保模型不会处理额外的填充位置，而位置编码提供了序列中每个元素的位置信息。

4.Transformer 中注意力遮蔽、位置编码是如何工作的？

注意力遮蔽通过将一些位置的注意力权重设为负无穷（在softmax之前），从而在计算注意力时忽略这些位置，常用于遮蔽解码器中未来的位置以防止信息泄露。
位置编码通过加入可学习或固定的向量来实现顺序感知，使模型能够区分不同位置的输入，解决了自注意力机制缺乏顺序感知能力的问题。

5.什么是世界模型？

AI 系统对现实世界运作机制的内在理解（理想状态）。理论上应包含物理定律（重力）、社会规范（礼仪）、因果关系（下雨导致湿衣）等，使 AI 能进行合理推理、预测并生成符合逻辑的内容。当前 AI 主要依赖文本 / 图像的统计关联模拟思维，距离真正的 “世界理解” 尚远。

### 二、智能体组成

1.什么是大模型 Agent？它与传统的 AI 系统有什么不同？

大模型 Agent（LLM Agent）是一种基于大型语言模型（LLM）的智能体，能够自主解析任务、调用工具、执行推理，并与环境交互。它通常具备以下特点：

    基于 LLM 的决策：利用大模型的自回归生成能力

进行推理，而非传统的手工编写规则或强化学习策略。
动态工具调用：可以根据任务需要调用 API、数据库、搜索引擎或外部计算工具（如 Wolfram Alpha）。
上下文记忆：通过长上下文窗口或外部存储（如 RAG、向量数据库

    ）维护长期记忆，以支持跨回合交互。
    可扩展性：与传统 AI 系统相比，LLM Agent 可以无缝适配不同任务，而无需针对特定任务进行专门训练。

与传统 AI 系统的区别：

    传统 AI 依赖 固定的规则或模型（如分类器、知识图谱），适用于特定任务，但泛化能力较弱。
    LLM Agent 通过 自然语言推理 实现通用任务处理，并能 动态调用工具 解决复杂问题。
  
2.LLM Agent 的基本架构有哪些组成部分？

LLM Agent 典型的架构包括：

    任务解析模块（Task Parser） ：通过 LLM 解析输入的任务或用户指令，识别目标和潜在子任务。

2. 计划与推理模块（Planning & Reasoning）

        采用基于 Chain-of-Thought

（CoT）
或 ReAct

        （Reason + Act）等技术进行多步推理，确保任务执行的合理性。

3. 工具调用（Tool Use / API Calling） ：通过插件机制或 API，调用搜索引擎、数据库、代码执行环境、计算引擎（如 Python 计算）。

4. 记忆管理（Memory & Retrieval）：维护短期记忆（Session Context）和长期记忆（向量数据库、知识库）以支持连续对话或长期任务。

5. 执行反馈（Execution & Feedback） ：观察执行结果，进行自我纠错（Self-Refinement）或元推理（Meta-Reasoning）以优化任务执行流程。

3.LLM Agent 如何进行决策？能否使用具体的方法解释？

LLM Agent 的决策机制通常基于以下方法：

    基于 Chain-of-Thought（CoT）推理 

    通过显式的逐步推理，使模型在生成答案前先展开推理步骤。
    例如： 用户：某个城市的 GDP 是否比全国平均值高？
    Agent（CoT）：首先获取该城市的 GDP 数据 -> 获取全国 GDP 平均值 -> 进行比较 -> 生成答案。

2. 基于 ReAct（Reasoning + Acting）框架

        结合逻辑推理与行动执行（如 API 查询、数据库检索），避免模型直接“胡编”答案。
        例如： 任务：查询某个公司 2023 年的财报数据 Agent（ReAct）：
            思考：“我需要找到该公司的财报网站”
            行动：“调用 Google 搜索 API”
            观察：“找到了 SEC 备案数据” - 生成最终答案

3. 基于 Self-Reflection / Self-Correction

        Agent 生成初步答案后，可回顾自己的推理过程并进行修正，如 GPT-4 Turbo 的 Reflexion 方法。

4.如何让 LLM Agent 具备长期记忆能力？

LLM 本身的上下文窗口有限，通常通过以下方式增强长期记忆：

    向量数据库（Vector Database）+ RAG（Retrieval-Augmented Generation） 

    关键步骤：
        将历史对话或知识存入向量数据库（如 FAISS、ChromaDB）。
        在交互时检索相关内容，合并进 LLM 的输入上下文。

2. Memory Transformer

/ Hierarchical Memory

        通过分层存储记忆：
            短期记忆（Session Context）：保留最近的对话内容。
            长期记忆（Long-Term Embeddings）：重要信息存入外部存储，并在必要时召回。

3. Fine-tuning
+ Knowledge Distillation

        预训练 LLM 使其掌握特定领域知识，提高在该领域的回答准确性。

5.LLM Agent 如何进行动态 API 调用？

通常采用以下方式：

    插件机制（Plugins） ：OpenAI Plugin、LangChain

    Agents 允许 LLM 直接调用 API。

2. 动态函数调用（Function Calling） ：通过 OpenAI GPT-4 Turbo 的 function-calling 机制，自动解析 JSON 结构并调用相应 API： { "name": "search_stock_price", "parameters": { "ticker": "AAPL" } }

3. 代码解释器（Code Interpreter） ：通过 Python 运行环境执行计算、数据处理等任务。

6.LLM Agent 主要有哪些局限性？

幻觉问题
（Hallucination）：模型可能生成虚假信息。
上下文窗口限制：无法长期记忆大量历史信息。
计算成本高：推理消耗大量计算资源。
缺乏实时数据：需结合外部 API 获取最新信息。

7.如何衡量 LLM Agent 的性能？

常见评估指标：

    任务成功率（Task Completion Rate）
    工具调用准确率（Tool Usage Accuracy）
    推理质量（Reasoning Quality）





