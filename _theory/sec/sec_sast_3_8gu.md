---
title: "静态漏洞挖掘：八股文 （Part 3/3）"
excerpt: '代码审计与自动化的八股文'

collection: theory
category: sec
permalink: /theory/sast-8gu
tags: 
  - code audit
  - sast

layout: single
read_time: true
author_profile: false
comments: true
share: true
related: true
---

![](../../images/theory/8gu.png)

**1.拿到一份Java/Go/C代码进行代码审计，审计流程是怎样的？**
- 首先确定审计范围，然后了解代码的业务。
- 根据经验判断业务可能出现的漏洞类型。
- 通过SAST工具编写规则，寻找漏洞。

**2.不同业务对应的漏洞类型？**
- 参与数据库的交互，可能存在sql注入。
- 参与页面的渲染，可能存在xss注入。
- 参与系统命令的执行，可能存在命令注入。
- 参与序列化数据的处理，可能存在反序列化漏洞。
- 参与鉴权操作，可能存在越权漏洞。
- 参与向外部服务的请求，可能存在SSRF。
- 参与内存操作，可能存在内存损坏。

**3.怎么审计xx漏洞？**
1. 审计命令注入漏洞、反序列化漏洞、内存损坏漏洞。
- 污点分析，定位所有危险的sink点，从用户可控的source点开始，判断可达性。
2. 审计sql注入、xss注入。
- 用户输入一定是可达的，因此关注：注入防御策略是否有效。
- sql预编译是否有效。
- xss黑白名单是否有效。
3. 审计越权漏洞、SSRF。
- 深入业务逻辑，人工操作。

**4.SAST、IAST和RASP相关问题？**
1. SAST如何降低误报率？
- 使用AI LLM对扫描结果进行分析。
- 污点可达性分析。
- 细化SAST的规则，按业务场景选择规则库。
2. SAST和IAST分别的优点和缺点？
- SAST优点是在开发的早期检测漏洞，缺点是误报率高。
- IAST优点是误报率低，缺点是只能检测实际执行的代码。
3. SAST和IAST常见工具的原理？
- codeql和joern，通过建立代码的控制流图、数据流分析，结合审计写查询语句检测漏洞。里面有封装好的CWE 语句。
- IAST通过插桩agent来动态检测漏洞。
4. SAST和IAST如何集成到CI/CD中？
- 代码提交后，自动触发SAST和IAST生成检测结果。
- 确保在代码合并、部署之前通过SAST和IAST。
5. IAST和RASP的异同？
- 二者都通过插桩agent，在运行时检测漏洞。
- IAST运行在测试环境，RASP运行在生产环境。
- RASP同时拦截攻击。

**5.如果多进程下，A进程的Source触发到了B进程的sink点，如何溯源？**

**6.针对一个开源项目Redis，如何静态挖掘？**

规定挖掘Redis漏洞的范围，核心模块：
- 服务接口：如Redis使用RESP协议，测试该协议。
- 缓存命令：测试命令的执行路径。
- 多路复用：主要测试竞态条件。
- 主从复制：测试主从节点的交互。
- 持久化：测试持久化文件格式的解析。

**追问1：如何保证你的测试覆盖了缓存中间件的核心攻击面（如主从复制、持久化等）？**

- 基于源代码：通过静态分析（Joern）确保我们标记了所有从外部接收输入的入口点（Source），这是我们测试覆盖的起点。

**工具目前支持Redis和Memcached，如果现在需要你快速接入一种新的缓存中间件，例如KeyDB或Dragonfly，工具架构需要做哪些调整？如何设计以最小化适配成本？**

- 静态分析：分析哪些源代码文件是核心模块。


**7.为何选择Joern而不是其他SAST工具（如CodeQL）？Joern的CPG（代码属性图）模型对于你的审计任务有什么优势？**

- Joern不需要编译，因此更方便针对核心模块，或者无源码模块。
- Joern建立CPG（代码属性图），编写复杂的污点分析查询非常灵活和强大。


**8.请以一个具体的漏洞类型（如缓冲区溢出，整型溢出）为例，详细描述你编写的Joern脚本的污点分析流程？**

1. 缓冲区溢出
- 定义Source点，网络接收数据的函数，如 read、recv、readQueryFromClient。
```scala
def source = cpg.call("readQueryFromClient").argument
```
- 定义Sink点，执行内存操作的危险函数，memcpy(dest, src, n)，strcpy(dest, src)，sprintf(dest, fmt, ...)，memmove(dest, src, n)。
```scala
def sink = cpg.call.name("memcpy", "strcpy", "sprintf", "memmove")
```
- 污点分析传播路径查询
```scala
cpg.call("memcpy")
  .argument(3) // 索引从1开始，argument(3)是size参数
  .reachableBy(source) // 查看哪个Source可以流向这个size参数
  .p // 打印结果
```
2. 整型溢出
- 定义Source点，网络读取函数、协议解析函数中解析出的长度字段。
```scala
val source = cpg.call("readQueryFromClient").argument ++
             cpg.call.name("<operator>.indexAccess").argument(2)
```
- 定义Sink点，内存分配函数：malloc(size)、calloc(n, size)、realloc(ptr, size)、zmalloc(size)中的size参数；内存拷贝函数：memcpy(dest, src, n)、memset(dest, val, n)中的n参数；循环边界：for (i=0; i < n; i++)中的n。
```scala
val sink = cpg.call.name("malloc", "calloc", "realloc", "zmalloc", "memcpy").argument(1)
```
- 污点分析传播路径查询
```scala
sink
  .reachableBy(
    source
      .reachableByFlows(cpg.call.name("<operator>.addition", "<operator>.multiplication", "<operator>.subtraction")) // 找到所有能被Source到达的算术运算结果
      .map(_.elements.last) // 取运算结果作为新的起点
  )
  .p
```

**追问1：在污点传播过程中，你的分析是过程内（Intra-procedural）还是过程间（Inter-procedural）的？**

- 过程间分析，Joern通过CPG实现了这一点。

**追问2：静态分析普遍存在误报。你采取了哪些策略来降低误报率？**

- 识别净化点（Sanitization），例如，真正的漏洞路径中，Source数据在到达Sink前没有经过正确的长度检查，减少误报。
- AI辅助，对Joern输出的潜在路径进行AI辅助代码审计。

**追问3：发现潜在漏洞后，如何验证其真实性？**

- 根据潜在漏洞的代码逻辑，编写PoC。
- 转化为Fuzzer的测试对象进行动态验证。