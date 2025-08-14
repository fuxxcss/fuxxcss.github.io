document.addEventListener('DOMContentLoaded', function() {
    // 获取左侧目录容器
    const tocSidebar = document.querySelector('.toc-left-sidebar');
    if (!tocSidebar) return;
    
    // 收集文章标题（根据实际容器调整选择器）
    const articleContainer = document.querySelector('.page__content');
    if (!articleContainer) return;
    const headings = articleContainer.querySelectorAll('h2, h3, h4');
    if (headings.length === 0) return;
  
    // 创建目录结构
    const tocList = document.createElement('ul');
    tocList.className = 'toc-list';
    
    let lastLevel = 2;
    let currentList = tocList;
    const listStack = [tocList];
    
    headings.forEach(heading => {
      // 确保标题有ID
      if (!heading.id) {
        heading.id = heading.textContent.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+$/, '');
      }
      
      const level = parseInt(heading.tagName.substring(1));
      
      // 处理层级变化
      if (level > lastLevel) {
        // 创建新的子列表
        const newList = document.createElement('ul');
        newList.className = 'toc-sublist';
        currentList.lastElementChild.appendChild(newList);
        listStack.push(newList);
        currentList = newList;
      } else if (level < lastLevel) {
        // 回退到上级列表
        const levelDiff = lastLevel - level;
        for (let i = 0; i < levelDiff; i++) {
          if (listStack.length > 1) {
            listStack.pop();
            currentList = listStack[listStack.length - 1];
          }
        }
      }
      
      // 创建目录项
      const tocItem = document.createElement('li');
      tocItem.className = `toc-item toc-level-${level}`;
      
      const tocLink = document.createElement('a');
      tocLink.href = `#${heading.id}`;
      tocLink.textContent = heading.textContent;
      tocLink.dataset.target = heading.id; // 存储目标ID
      
      // 添加平滑滚动
      tocLink.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.getElementById(this.dataset.target);
        if (target) {
          window.scrollTo({
            top: target.offsetTop - 80,
            behavior: 'smooth'
          });
          // 更新URL
          history.replaceState(null, null, `#${target.id}`);
        }
      });
      
      tocItem.appendChild(tocLink);
      currentList.appendChild(tocItem);
      lastLevel = level;
    });
  
    // 添加到侧边栏
    const tocContainer = document.createElement('div');
    tocContainer.className = 'toc-container';
    tocContainer.innerHTML = `
      <div class="toc-header">
        <span>文章目录</span>
        <button class="toc-toggle">▲</button>
      </div>
    `;
    tocContainer.appendChild(tocList);
    tocSidebar.appendChild(tocContainer);
  
    // 滚动高亮功能
    let activeTocLink = null;
    
    function updateActiveLink() {
      // 找到最接近视口顶部的标题
      let closestHeading = null;
      let minDistance = Infinity;
      
      headings.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        const distance = Math.abs(rect.top);
        
        // 优先选择视口上方或附近的标题
        if (rect.top <= 150 && distance < minDistance) {
          minDistance = distance;
          closestHeading = heading;
        }
      });
      
      // 如果没有找到，使用最后一个标题
      if (!closestHeading && headings.length > 0) {
        closestHeading = headings[headings.length - 1];
      }
      
      // 更新高亮
      if (closestHeading) {
        const targetLink = tocContainer.querySelector(`a[data-target="${closestHeading.id}"]`);
        if (targetLink) {
          if (activeTocLink) activeTocLink.classList.remove('active');
          targetLink.classList.add('active');
          activeTocLink = targetLink;
          
          // 滚动目录到活动项
          const listRect = tocList.getBoundingClientRect();
          const linkRect = targetLink.getBoundingClientRect();
          
          if (linkRect.bottom > listRect.bottom || linkRect.top < listRect.top) {
            tocList.scrollTo({
              top: targetLink.offsetTop - tocList.offsetTop - 100,
              behavior: 'smooth'
            });
          }
        }
      }
    }
    
    // 折叠功能
    const toggleBtn = tocContainer.querySelector('.toc-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        tocSidebar.classList.toggle('collapsed');
        this.textContent = tocSidebar.classList.contains('collapsed') ? '▼' : '▲';
      });
    }
  
    // 初始化
    updateActiveLink();
    window.addEventListener('scroll', updateActiveLink);
    window.addEventListener('resize', updateActiveLink);
    
    // 添加滚动缓冲（优化性能）
    let isScrolling;
    window.addEventListener('scroll', () => {
      window.clearTimeout(isScrolling);
      isScrolling = setTimeout(updateActiveLink, 100);
    });
  });