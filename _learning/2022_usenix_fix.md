---
title: "FixReverter: 用于模糊测试Benchmark的Bug注入方法"
excerpt: 'USENIX Security Symposium 2022 , FIXREVERTER: A Realistic Bug Injection Methodology for Benchmarking'

collection: learning
category: paper
permalink: /learning/2022-usenix-fix
tags: 
  - usenix
  - patch
  - fuzz

layout: single
read_time: true
author_profile: false
comments: true
share: true
related: true
---

![](../images/learning/2022_usenix_fix/1.png)

## 模糊测试的Benchmark
FixReverter开源在[github](https://github.com/UTD-FAST-Lab/RevBugBench)。
什么是Benchmark ? Benchmark的定义：评估一个改进方法比现状表现的更好。
### 一、SOTA

**1.谷歌FuzzBench**

FuzzBench以**代码覆盖率**作为衡量标准：
同一目标，B生成的testcase相比于A执行更多的分支，认为B比A发现更多的bug。
**缺点**：研究表明，比较哪个fuzzer更优越，覆盖率和发现更多bug没有很强的一致性。

**2.独特的crashes**

独特的crashes以**引发崩溃的testcase**作为衡量标准：
同一目标，B生成的testcase相比于A触发更多不同的崩溃，认为B比A发现更多的bug。
**缺点**：两个不同的testcase很可能引发同一个bug，重复性删除会对后续测试产生影响，比如：删除了其他bug的证据。

**3.基于经验的比较**

1.和2.的共性是，不对目标作修改，bug数量和索引是未知的。
Klees等人提出的基于经验的比较，以触发**已知bug**作为衡量标准：
使用存在已知bug的目标，针对触发已知bug的数量来开发Benchmark。

### 二、四大准则

G1 . Benchmark应该使用相关的、真实世界的目标程序。
G2 . 这些程序应该包含现实的、相关的bug(例如，内存损坏/崩溃的bug)。
G3 . 当一个特定的bug被触发时，应该清楚地指出bug索引，以避免重复性删除的问题。
G4 . 应该防止过拟合。

## FIXREVERTER

基于上述4个目标，作者提出FIXREVERTER，和该工具制作的REVBUGBENCH。FIXREVERTER是一个bug注入工具：
![](../images/learning/2022_usenix_fix/2.png)
### 一、将模式作为输入
对于CVEs，通过源码比对找出其patch漏洞的共通模式。通用的patch模式有三种：
1. 条件终止(ABORT)
2. 条件执行(EXEC)
3. 条件分配(ASSIGN)

**1.条件终止**

特点是增加一个if语句，对程序涉及的变量进行检查，如果不满足条件，则中断控制流(例如，从函数返回)。
![](../images/learning/2022_usenix_fix/3.png)

**2.条件执行**

特点是在现有条件语句(if、while和for)中添加一个连接布尔表达式，对程序涉及的变量进行检查。
![](../images/learning/2022_usenix_fix/4.png)

**3.条件分配**

特点是增加一个新的if语句，对程序涉及的变量进行检查，满足条件则进行赋值。
![](../images/learning/2022_usenix_fix/5.png)

### 二、语法匹配
在源码中匹配三个模式，定位到代码区域，每个区域都是候选的注入点。服务于后续步骤。
### 三、静态可达性&依赖性分析
首先对源码进行静态分析，明确调用关系。
可达性：通过指定入口点能否到达注入点，不可达的注入点是没有意义的。
依赖性：对变量染色，是否存在source-sink流。source=注入点，sink=崩溃点，无依赖的注入点也是没有意义的。该流程如下图所示：
![](../images/learning/2022_usenix_fix/6.png)

### 四、bug注入

对于可达的、存在依赖的注入点进行bug注入。注入bug的方法是对注入点处的patch进行还原。如下图所示，对注入点的patch（条件终止）还原，分配bug索引为529。
![](../images/learning/2022_usenix_fix/7.png)
可以看到修改后的代码启用了条件编译，宏FRCOV用于实现程序的两个状态。
**1.fuzzer状态**
宏FRCOV未定义时，处于fuzzer状态。此时patch还原为if(0) continue，等待fuzzer状态下生成引发崩溃的testcase。
**2.识别bug状态**
定义宏FRCOV，处于识别bug状态。接收fuzzer状态引发崩溃的testcase作为输入。
每个注入的bug有三个状态，这是衡量fuzzer性能的第一个标准：

1. 不可达态，testcase永远不会到达该bug。
2. 到达态，testcase到达了bug判断条件语句。
3. 触发态，testcase触发了该bug。

FIXREVERTER匹配所有模式注入bug，所以并非只在CVEs存在的区域注入，导致一个bug可能不会引发崩溃。为此设置了injectFlag数组，用来细分崩溃原因：
1. 置位injectFlag[529]时，对bug529的到达态和触发态进行记录，不执行continue。
2. 不置位injectFlag[529]，相当于patch。

假如bug529和bug530都处于触发态，这时如何判断crash的原因？

1. 如果只置位injectFlag[529]时，程序仍然crash，称bug529是crash的独立原因
2. 如果同时置位injectFlag[529]和injectFlag[530]才引发崩溃，称bug529和bug530是crash的组合原因。

独立原因和组合原因作为衡量fuzzer性能的第二个标准。

### 五、过滤幼稚bug

通过回归测试、简单模糊测试就能触发的bug，需要剔除。

## REVBUGBENCH
运行FIXREVERTER生成的目标程序称为REVBUGBENCH，在此程序上得出的实验结果作为fuzzer的Benchmark。
论文作者从binutils中选取cxxfilt和disassemble两个程序，从FuzzBench中选取其他8个，在C源码上运行FIXREVERTER生成REVBUGBENCH。
![](../images/learning/2022_usenix_fix/8.png)
REVBUGBENCH的评估因素：到达态、触发态、独立原因、独立+组合原因。对AFL、AFL++等主流fuzzer进行评估，得出结果：总体而言，fuzzer在reach、trigger和cause指标上表现一致。
![](../images/learning/2022_usenix_fix/9.png)
优秀的fuzzer，比如AFL++在cause指标上表现好时，往往在reach和trigger指标上也好。
## 总结
作者提出四大原则，对比其他Benchmark，解释FIXREVERTER如何满足G1~G4：

G1：在FuzzBench的8个程序和binutils的2个程序上运行FIXREVERTER，满足现实世界程序的目标。
G2：基于CVE模式在程序中注入bug，满足包含现实的、相关的bug这一目标。
G3：在注入bug时为每个bug分配索引，满足明确指示特定bug这一目标。
G4：REVBUGBENCH是发展的，因为在一个新目标上运行FIXREVERTER，就可以生成一个新的Benchmark。确保fuzzer不会对单一的Benchmark过拟合。
