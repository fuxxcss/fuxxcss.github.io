---
title: "漏洞挖掘方法论，你是如何找到漏洞的"
excerpt: 'OffensiveCon 2022 , Mark Dowd - Keynote - How Do You Actually Find Bugs'

collection: learning
category: topic
permalink: /learning/2022-offensivecon-bugs
tags: 
  - offensivecon
  - fuzz
  - code audit

layout: single
read_time: true
author_profile: false
comments: true
share: true
related: true
---

![](../images/learning/2022_OffensiveCon_bugs/1.png)

## 面对失败

想成为成功的安全研究员，需要有能力和信心面对失败。

### 一、当你的研究碰壁时，切换到另一个项目。

另一个项目可以是和安全不相干的，有助于找回失去的信心，同时可以帮助你换一个角度看问题。
![](../images/learning/2022_OffensiveCon_bugs/2.png)

### 二、向前走，知道何时放弃

坚持是很重要，但是可能你只是在浪费时间。有的时候，选择放弃很难，因为你持续的投入，大量的沉淀成本让你陷入舒适区。
知道何时放弃，是为了向前走，在积累经验后，未来继续挑战。
![](../images/learning/2022_OffensiveCon_bugs/3.png)

### 三、保持好奇心

技术工作是枯燥的，保持对技术的好奇心是你对抗失败的资本。
![](../images/learning/2022_OffensiveCon_bugs/4.png)

### 四、向patch学习

如果你挖掘出了漏洞，却发现它已经被修复了，虽然这让人沮丧，但是这正说明你走在正确的道路上。
以此激励你寻找该漏洞的变体、新的漏洞模式。
![](../images/learning/2022_OffensiveCon_bugs/5.png)

### 五、相信自己

做任何工作，信心都很重要，尤其对于安全研究来说。一些你推崇的安全研究专家也曾陷入自我怀疑，所以你要做的就是相信自己。
![](../images/learning/2022_OffensiveCon_bugs/6.png)

### 六、走出误区

在代码审计领域，常见的有三点误区。
- **误区1**：如果这个项目有漏洞，早被别人发现了。
- **误区2**：该目标已经被fuzz很多年了，已经没漏洞了。
- **误区3**：这个攻击面不那么有趣（比如浏览器媒体解析）。

不要让误区成为你开始的阻碍。
![](../images/learning/2022_OffensiveCon_bugs/7.png)

### 七、使用官方文档

官方文档是巨大的宝藏，可以节省你大量时间，来理解代码。同时你可以传入文档和代码片段给LLM，帮助你深入理解代码，进行代码审计、逆向工程、编写harness。
![](../images/learning/2022_OffensiveCon_bugs/8.png)

## 代码审计流程

代码审计的关键在于理解代码，迭代学习。

### 一、理解代码

虽然fuzz和静态漏洞检测很有用，但他们不是全部过程。大部分人过于依赖工具，而忽略了理解代码的重要性。

**1. 深度理解代码，考虑各种情况**

可以发现：目标程序的小特性，怪异api的误用，细微的不一致。以[CVE-2021-30949](https://project-zero.issues.chromium.org/issues/42451354)（XNU kernel use-after-free in mach_msg）为例，对一个怪异api传参状态的理解分析，发现了一个有趣的UAF漏洞。
漏洞出现的原因是mach_msg业务根本没有考虑到这种传参状态，正说明理解代码对漏洞发现的关键作用。
![](../images/learning/2022_OffensiveCon_bugs/9.png)

**2. 在不理解代码时，你以为的攻击面通常是无效的**

理解代码有助于确认攻击面，漏洞的发现基于一个正确的攻击面（比如BIOS fuzz），如果有人发现了一个新的攻击面，那么他据此挖掘出100+个漏洞也是不足为奇的。
攻击面可以是间接的（比如漏洞缓解本身可能是攻击面），最好的攻击面是那些隐藏的，不明显的。
![](../images/learning/2022_OffensiveCon_bugs/10.png)

**3. BugTrack和Diff是理解代码的重要环节**

追溯一个漏洞是宝贵的环节，它可以帮助你理解：一个漏洞长什么样；在哪里；产生的原因是什么。同时启发你寻找攻击面、发现新的漏洞（漏洞的变体；其他位置、其他程序的相同类型漏洞）。
![](../images/learning/2022_OffensiveCon_bugs/11.png)

### 二、记录发现，反复优化

在流程中，记录你的想法、对代码的理解、可疑的漏洞点。不定时重温记录，对其进行优化，因为代码是不断进行版本迭代的：代码逻辑会被重写；特性会被添加；应用场景会发生变化。 
![](../images/learning/2022_OffensiveCon_bugs/12.png)

### 三、学习他人的经验

为什么他能发现漏洞？他是通过什么方法，针对的哪个攻击面？对比他人，反思自己的盲点，优化自己的方案。
![](../images/learning/2022_OffensiveCon_bugs/13.png)

### 四、工具化和代码审计

fuzz和静态检测，本质上是**写代码**，代码审计，本质上是**读代码**。想要在安全研究取得成果，需要平衡好读和写。
太多人专注于自动化工具的编写，却不理解代码，使用错误构造的测试用例，针对想象的攻击面，结果是根本无法发现漏洞。工具化的目的是实践于漏洞的挖掘，如果对工具化过于执着，就会陷入误区，把安全研究当成了软件开发。
![](../images/learning/2022_OffensiveCon_bugs/14.png)

## 总结

漏洞研究很困难，但是是一门可以学习的技术。如何面对失败，能否持续学习是成功的关键。读代码与写代码截然不同，同样需要大量的实践。
![](../images/learning/2022_OffensiveCon_bugs/15.png)

