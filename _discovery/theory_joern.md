---
title: "joern代码分析平台"
excerpt: '官方文档的学习笔记'

collection: discovery
category: theory
permalink: /theory/joern-note
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

![](../images/discovery/joern.png)

## 综述

joern是针对源代码、字节码和二进制码进行健壮性分析的平台。核心数据结构是代码属性图（CPG），作为跨语言代码分析的抽象表示，CPG存储于图数据库中，使用特定的Scala查询语句能够挖掘代码中的漏洞。

### 一、适配的语言

joern除了能够分析源代码，还能够分析编译后的字节码、二进制码。

**超高度**适配的语言：
- C/C++，基于Eclipse CDT
- Java，基于JavaParser

**高度**适配的语言：
- JavaScript，基于GraalVM
- Python，基于JavaCC
- x86/x64，基于Ghidra

**中度**适配的语言：
- JVM Bytecode，基于Soot
- Kotlin，基于IntelliJ PSI
- PHP，基于PHP-Parser
- Go，基于go.parser

### 二、核心功能

joern有以下5个核心功能：
1. 健壮的解析，对于不能提供工作构建环境或部分代码丢失，也能够导入joern进行分析。
2. CPG，创建具有语义的代码属性图，存储在基于内存存储的图数据库中。
3. 污点分析，提供静态污点分析引擎，跟踪恶意数据的传播。
4. 查询语句，基于Scala实现了查询语言，用于手动制定漏洞的查询规则，也可以使用机器学习技术自动推断漏洞。
5. 使用CPG pass进行扩展，CPG是多层的，在不同的抽象层次上都提供有关代码的信息，joern允许通过CPG pass添加额外信息，扩展查询语句。

## CPG


