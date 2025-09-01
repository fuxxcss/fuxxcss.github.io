---
title: "八股文：计算机四大件"
excerpt: '四大件、手撕算法和SQL'

collection: theory
category: basic
permalink: /theory/basic-8gu-big4
tags: 
  - cs
  - 8gu
  - sql

layout: single
read_time: true
author_profile: false
comments: true
share: true
related: true
---

![](../../images/theory/8gu.png)

## 网络协议

### 一、TCP/UDP

TCP、UDP都在传输层，TCP全称传输控制协议，UDP全称用户数据协议。

**1.TCP和UDP的区别？**

- 区别在于可靠性保证，TCP面向连接，确保可靠性。
- TCP实现可靠传输，提供校验和、SYN/ACK、超时重传、最大消息长度、滑动窗口控制。
- UDP头部字段：端口号、校验和，TCP头部多了SYN、ACK、滑动窗口大小字段。

**2.TCP为什么是三次握手，四次挥手？**

为什么不是两次或者是四次握手？
- 两次握手，服务端无法区分历史报文、新的连接。
- 三次握手，区分历史报文，确认双方都具备发送、接收能力。
- 四次握手，无价值。

为什么是四次挥手，比握手多一次？
- 四次挥手，服务端处理完剩余数据，才发送FIN给客户端。
- 比握手多一次，因为握手时SYN-ACK合并发送，挥手时FIN、ACK分开发送。

**3.TCP三次握手的过程？**
- 一次握手，客户端发送SYN，请求建立C-S连接。
- 二次握手，服务端发送SYN-ACK，确认C-S连接，请求建立S-C连接。
- 三次握手，客户端发送ACK，确认建立S-C连接。

**4.TCP四次挥手中的等待时间？**
- 二次挥手、三次挥手之间，服务端等待时间close_wait，目的是处理剩余数据。
- 四次挥手之后，客户端等待时间time_wait，目的是确保TCP关闭，留下ACK重传时间。

**5.UDP如何实现可靠性，如何实现重传？**
- 使用QUIC实现。
- QUIC计算RTT，超时重传；基于QUIC的包编号机制，实现快速重传。

### 二、HTTP/HTTPS

HTTP全称超文本传输协议。

**1.HTTP和HTTPS 的区别？**
- HTTPS的S代表SSL/TLS协议，使用TLS确保数据安全。

**2.SSL/TLS三次握手的过程？**
- 一次握手，客户端发送密钥参数。
- 二次握手，服务端选择对称加密套件，发送CA签发的证书（包含公钥）。
- 三次握手，客户端校验证书，使用公钥加密主密钥，发送。
- 双方使用主密钥，建立对称加密通道。

**3.HTTP不同版本的区别？**
- HTTP/1.1，广泛使用的。
- HTTP/2.0，在1.1之上解决队头阻塞，头部压缩，仍然使用TCP协议。
- HTTP/3.0，基于QUIC，UDP协议可靠性传输。

**4.HTTP协议常见的请求方法？**
1. GET，场景：获取电子产品列表、加载网页。
2. POST，场景：提交用户名密码登录、执行支付操作。
3. PUT，场景：更新用户的全部信息、上传新版本pdf。
4. PATCH，场景：更新用户的邮箱、修改订单状态为“已发货”。
5. DELETE，场景：删除指定ID的商品、移除用户购物车中的第k项商品。
6. HEAD，场景：检查文件是否存在及大小、判断本地缓存是否有效。
7. OPTIONS，场景：浏览器询问服务器是否允许跨域请求、查询api支持哪些HTTP方法。

**5.HTTP协议的状态码？**
- 1xx，请求已接收，需要继续处理。
- 2xx，请求成功。
- 3xx，重定向，需要进一步操作，比如未登录。
- 4xx，客户端错误。
- 5xx，服务端错误。

高频状态码：
- 302，跳转新地址，下次仍请求原URL。
- 400，缺失参数，或者json格式错误。
- 403，无访问权限。
- 500，代码未处理异常，或者配置错误。
- 502，网关错误。
- 504，网关超时。

### 三、其他协议

WebSocket和SSE都用于解决HTTP实时性通信不足的问题，RPC用于解决HTTP跨进程/跨网络服务调用困难的问题。

**1.为什么LLM网站使用SSE而不是WebSocket？**
- SSE基于HTTP长连接，特点是服务端单向推送，场景：LLM流式文本输出。
- WebSocket基于TCP，特点是双向通信，场景：多人在线、物联网远控。

**2.WebSocket断开连接怎么办？**
- 断连的原因：网络波动、服务重启、认证过期。
- 实时检测心跳，自动重连。

**3.RPC相比于HTTP的优势？**
- 基于服务注册发现，可以实现自动IP感知。
- 自动序列化。

**4.Ping命令的执行过程？**
- 基于 ICMP 协议，收到响应后计算RTT。
- 收不到响应，原因有：目标不可达、超时

## 操作系统

### 一、进程和线程

**1.进程和线程的区别？**
- 进程至少有一个主线程，线程是CPU调度的基本单元。
- 进程间通过虚拟地址空间隔离，线程间共享进程的整个地址空间。
- 进程fork()、进程调度开销大，线程pthread_create()、线程调度开销小。

**2.进程/线程的状态？**
- 5种进程状态：运行态、睡眠态（可中断）、磁盘休眠态（不可中断）、暂停态（或者被ptrace）、僵尸态。
- 4种线程状态，复用task_struct：可运行态、等待态、超时等待态、阻塞态。

**3.进程/线程间通信的方式？**

进程间通信方式：
- 管道，匿名管道（父子进程/兄弟进程间使用）、命名管道（通过文件系统路径访问）。
- **消息队列**，支持多进程、异步通信。
- 共享内存，多个进程映射同一块物理内存，需同步机制（信号量）。
- 套接字，通常用于跨网络通信，也可用于本机。
- 信号，不能传输数据，仅作进程事件的通知。

线程间通信方式：
- 共享内存，多线程直接读写全局变量/堆内存，需同步机制（互斥锁、条件变量）。

**4.多进程/多线程的优缺点？**
- 多进程，优点：地址空间隔离、避免崩溃影响；缺点：开销大，需要进程间通信。适用于CPU密集型。
- 多线程，优点：共享内存、开销小；缺点：崩溃互相影响。适用于I/O密集型。

**5.死锁如何产生的？如何解决？**
- 单线程、多个进程/线程因争夺资源而陷入相互等待。
- 产生死锁的4个必要条件：互斥访问、持有并等待、不可剥夺、循环等待。
``` python
import threading
import time

# 创建两把锁
lockA = threading.Lock()
lockB = threading.Lock()

def task1():
    
    lockA.acquire()
    time.sleep(1)
    lockB.acquire()  # 将在此处死锁
    
    # 临界区代码（实际不会执行到这里）
    lockB.release()
    lockA.release()

def task2():

    lockB.acquire()
    time.sleep(1)
    lockA.acquire()  # 将在此处死锁
    
    # 临界区代码（实际不会执行到这里）
    lockA.release()
    lockB.release()

# 创建并启动线程
t1 = threading.Thread(target=task1)
t2 = threading.Thread(target=task2)
t1.start()
t2.start()
```
- 锁超时机制：超时回退，随机时间后重试。
- 死锁检测：在资源图中DFS判环，选择最小代价回退。
- 可重入锁同步机制：避免单线程死锁，go不支持可重入锁。

### 二、I/O多路复用

**1.什么是I/O多路复用，复用的是什么？**
- 利用操作系统机制（select，poll，epoll）实现单个进程/线程，同时监控多个I/O通道（如文件描述符、网络套接字）。
- 复用的是，执行I/O的进程/线程。

**2.select，poll，epoll，kqueue实现的优缺点？**
- select，优点：全平台支持；缺点：文件描述符上限1024，fd集合全复制。
- poll，优点：无文件描述符上限，缺点：连接数增长时性能线性下降，pollfd全复制。
- epoll，优点：内核事件驱动，零拷贝优化（无重复复制）；缺点：仅支持linux。
- kqueue，macOS中的epoll。

### 三、linux命令

**1.进程操作命令**
- ps，进程快照（如排查Nginx是否运行），参数 aux，--sort。
- top，实时进程监控（如定位CPU飙高问题），参数 -d，-p，-u。
- kill，pkill，终止进程，kill参数 -2，-9；pkill参数 -f，-u。
- pgrep，查找进程ID，参数 -u，-x。
- netstat，检查端口占用或网络连接状态，参数 -tulnp。

**2.文件操作命令**
- cat，文件内容查看。
- awk，日志分析、统计数据。
- grep，通常伴随管道符 | ，搜索过滤。
- rm，删除文件、目录。
- chmod，文件权限管理，参数 -R，ugo。

## 设计模式

**1.go项目用到哪些设计模式？**
- 生成器模式，接口定义：初始化客户端、初始化测试用例集。
- 组合模式，将客户端、快照、测试用例集组合起来。
- 策略模式，接口定义：快照收集方法、变异策略方法。

**2.策略模式和工厂模式的区别？**
- 工厂模式，目的是创建一个接口对象。
- 策略模式，目的是给接口对象指定策略。

**3.单例模式的两种实现？**
- 饿汉式，go执行时即创建单例。
```go
var singleInstance *single = &single{}

func getInstance() *single {
  return singleInstance
}
```
- 懒汉式，go使用sync.Once延迟创建单例。
```go
var singleInstance *single
var once sync.Once

func getInstance() *single {
  if singleInstance == nil {
    once.Do(
      func() {
        singleInstance = &single{}
      })
  }
  return singleInstance
}
```
python重写__new__来实现懒汉式。
```python
class Singleton:
    _instance = None  # 类变量，用于保存唯一的实例
    _lock = threading.Lock() # 创建一个锁对象

    def __new__(cls, *args, **kwargs):
        # 获取锁。只有一个线程能成功进入下面的代码块，其他线程会在此等待。
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                # 这里可以进行其他初始化操作
            return cls._instance
    def __init__(self, value):
        # 对于单例，__init__ 可能会被多次调用（每次 Singleton() 都会调用）
        # 所以这里我们可能希望只初始化一次，或者允许更新值
        self.value = value
```

**4.多线程下的观察者模式？**
- 观察者模式，一个主题维护一个观察者列表，在状态发生变化时通知它们。
- 多线程下，三个核心操作（注册、注销、通知）都要考虑同步问题。

**5.适配器模式的场景？**
- 设计一个解码器接口，可以解码不同格式的视频流。
- 设计一个格式转换接口，在不同数据格式之间进行转换。

## 手撕

1. 考虑到 做法
2. 考虑到 初始条件，边界条件

### 一、数组

**1.两数之和**
- map
- 1）first = 0，`first == N`
- 2）num = Nums[first]，`map[Target-num] == ok`

**2.三数之和**
- 排序 + 双指针
- 1）first = 0，`first == N`
- 2）second = 0，`second == N` 
- 3）third = N-1，`second == third`

**3.买卖股票的最佳时机**
- 一次遍历
- 1）i = 0，`i == N`

**4.搜索旋转排序**
- 二分查找
- 1）left = 0，right = N-1，`left > right`
- 2）mid = (right-left)/2 + left，`Nums[mid] == Target`

**5.全排列**
- 回溯
- 1）first = 0，`first == N`
- 2）i = first，`i == N`

**6.前K个最大元素**
- map
- 1）i = 0，`i == K`

**7.第K个最大元素**
- 快排 + 选择
- 1）pivot = partition(Nums, left, right)，`pivot == K`

**8.合并区间**
- 排序
- 1）i = 0，`i == N`

**9.合并两个有序**
- 双指针
- 1）p1 = 0，`p1 == N1`
- 2）p2 = 0，`p2 == N2`

**10.最大子序和**
- 动态规划
```
dp[i] = max{dp[i−1] + nums[i], nums[i]}
```
- 1）i = 1，`i == N`

**11.最长递增子序列**
- 动态规划
```
dp[i] = max{dp[j]} + 1, 其中 0 ≤ j < i 且num[j] < num[i]
```
- 1）i = 0，`i == N`
- 2）j = 0，`j == i`

### 二、图

**1.岛屿数量**
- DFS
- 1）row = 0，`row == NR`
- 2）col = 0，`col == NC`
- 3）DFS中，`row == 0 || row == NR || Grid[row][col] == '0'`
- 4）DFS中，`col == 0 || col == NC || Grid[row][col] == '0'`

**2.岛屿最大面积**
- DFS
- 1）row = 0，`row == NR`
- 2）col = 0，`col == NC`
- 3）DFS中，`row == -1 || row == NR || Grid[row][col] == '0'`
- 4）DFS中，`col == -1 || col == NC || Grid[row][col] == '0'`

### 三、链表

**1.反转**
- 一次遍历
- 1）cur = head，`cur == null`

**2.局部反转**
- 一次遍历
- 1）i = 0，`i == left`
- 2）i = 0，`i == right-left+1`
  
**3.K个一组反转**
- 递归
- 1）cnt = 0，`cnt < K`
- 2）i = 0，`i == K`

**4.返回入环点**
- map
- 1）cur = head，`cur == null`
- 2）`map[cur] == ok`
  
**5.合并有序**
- 递归
- 1）cur1 = head1，cur2 = head2，`cur1 == null || cur2 == null`

**6.删除倒数第K个节点**
- 栈
- 1）cur = dummy，`cur == null`
- 2）nodes = append(nodes，cur)，`len(nodes) < K`

**7.删除存在重复的元素（有序）**
- 一次遍历
- 1）cur = dummy，`cur.next == null || cur.next.next = null`
- 2）val = cur.next.val，`cur.next == null || cur.next.val != val`

**8.LRU缓存**
- 双向链表 + map

### 四、字符串

**1.复原IP地址**
- DFS
- 1）`segID == 4 && segBegin == len(str)` 
- 2）`segID != 4 && segBegin == len(str)`

**2.无重复字符的最长子串**
- 双指针（滑动窗口）+ map
- 1）i = 0，`i == N`
- 2）left = -1，char = str[left+1]，`left+1 == N || map[char] != 0`

**3.最长公共子序列**
- 动态规划，
```
dp[i][j] = { dp[i−1][j−1] + 1 ，当text1[i−1] = text2[j−1]
           { max(dp[i−1][j], dp[i][j−1]) ，当text1[i−1] != text2[j−1]
```
- 1）i = 0，`i == N1`
- 2）j = 0，`j == N2`

**4.最长回文子串**
- 动态规划
```
dp[i][j] = dp[i+1][j−1] ∧ (str[i] == str[j])
```
- 1）j = 0，`j == N`
- 2）i = 0，`i > j`

**5.有效的括号**
- 栈
- 1）i = 0，`i == N`

**6.比较版本号**
- 双指针
- 1）i = 0，j = 0，`i == N1 && j == N2`
- 2）`version1 != version2`

**7.两串相加**
- 模拟
- 1）i = N1-1，j = N2-1，carry = 0，`i == -1 && j == -1 && carry == 0`

### 五、树

**1.中序遍历**
- 递归
- 1）node = root，`node == null`

**2.层序遍历**
- 队列
- 1）`len(queue) == 0`
- 2）j = 0，`j == len(queue)`

**3.锯齿形层序遍历**
- 队列 + 奇数反转
- 同上

**4.右视图**
- 层序遍历
- 同上

**5.最近的公共祖先**
- 递归
- 1）node = root，`node == null`
- 2）`node.val == p.val || node.val == q.val`

### 六、多线程

**1.三个线程分别打印A、B、C，交替打印出ABCABCABC**
```go
// 创建三个通道用于goroutine间的同步
aChan := make(chan struct{})
bChan := make(chan struct{})
cChan := make(chan struct{})
	
// 使用WaitGroup等待所有goroutine完成
var wg sync.WaitGroup
wg.Add(3)
	
// 控制打印次数
count := 9
	
// goroutine A: 打印A
go func() {
	defer wg.Done()
	for i := 0; i < count/3; i++ {
		// 等待C的通知
		<-cChan
		fmt.Print("A")
		// 通知B打印
		aChan <- struct{}{}
	}
}()
	
// goroutine B: 打印B
go func() {
	defer wg.Done()
	for i := 0; i < count/3; i++ {
		// 等待A的通知
		<-aChan
		fmt.Print("B")
		// 通知C打印
		bChan <- struct{}{}
	}
}()
	
// goroutine C: 打印C
go func() {
	defer wg.Done()
	for i := 0; i < count/3; i++ {
		// 等待B的通知
		<-bChan
		fmt.Print("C")
		// 通知A打印(下一轮)
		if i < count/3-1 {
			cChan <- struct{}{}
		}
	}
}()
	
// 启动打印循环
cChan <- struct{}{}
	
// 等待所有goroutine完成
wg.Wait()
```
### 七、SQL

sql查询出每一门课都大于 80 分的学生姓名
sql：建表语句，id（自增）和time联合索引
4道sql：建表、字段分区、查询字段和、删除重复行
查询班级为 1 的相同名称学生有多少个？
一道 sql 题（查询学生平均分）
写 sql 语句，两个表简单 join 联表查询，加个 distinct 避免重复就可以了
sql 查找课程表男生和女生的总数
手撕 sql，获取当前薪水第二多的员工的 emp_no 以及其对应的薪水 salary,如果薪水相同，按员工序号从小到大排序
sql:求张三在第一季度的代码总数
sql 求部门中编写代码总数前十的人的信息